using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TaskFlow.Application;
using TaskFlow.Application.Validators;
using TaskFlow.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// 1. ADD SERVICES
// ============================================================

// Clean Architecture layers registered via extension methods
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();

// FluentValidation integration
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();

// ============================================================
// 2. JWT AUTHENTICATION
// ============================================================
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,                    // Token expiry is enforced
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero                   // No grace period — tokens expire exactly when declared
    };
});

builder.Services.AddAuthorization();

// ============================================================
// 3. SWAGGER WITH JWT SUPPORT
// ============================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TaskFlow API",
        Version = "v1",
        Description = "CRUD de Tarefas com autenticação JWT. Faça login em /api/auth/login e use o token no botão 'Authorize'."
    });

    // Add JWT button to Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Digite: Bearer {seu_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments in Swagger
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

// ============================================================
// 4. CORS (allows frontend to call the API)
// ============================================================
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// ============================================================
// 5. MIDDLEWARE PIPELINE (order matters!)
// ============================================================

// Global exception handler must be FIRST — catches all downstream errors
app.UseMiddleware<TaskFlow.API.Middleware.ExceptionHandlerMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TaskFlow API v1");
        c.RoutePrefix = string.Empty; // Swagger at root URL
    });
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();  // Must be BEFORE UseAuthorization
app.UseAuthorization();
app.MapControllers();

// ============================================================
// 6. AUTO-MIGRATE ON STARTUP (runs pending EF migrations automatically)
// ============================================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TaskFlow.Infrastructure.Data.AppDbContext>();
    db.Database.Migrate();

    // Seed Admin User if not exists
    if (!db.Users.Any(u => u.Email == "admin@taskflow.com"))
    {
        db.Users.Add(new TaskFlow.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Name = "TaskFlow Administrator",
            Email = "admin@taskflow.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123"),
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();
    }
}

app.Run();