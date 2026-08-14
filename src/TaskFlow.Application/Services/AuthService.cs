using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Application.Services;

public class AuthService : IAuthService
{
    private static readonly string DummyPasswordHash = BCrypt.Net.BCrypt.HashPassword("timing-only-password-value");
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ITokenService _tokenService;

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        if (await _userRepository.ExistsByEmailAsync(normalizedEmail, ct))
            throw new ConflictException("Email is already registered.");

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        var created = await _userRepository.CreateAsync(user, ct);
        return await GenerateAuthResponseAsync(created, ct);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email.Trim().ToLowerInvariant(), ct);
        var passwordMatches = BCrypt.Net.BCrypt.Verify(dto.Password, user?.PasswordHash ?? DummyPasswordHash);
        if (user is null || !passwordMatches)
            throw new BusinessException("Invalid email or password.");

        return await GenerateAuthResponseAsync(user!, ct);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken) || refreshToken.Length > 512)
            throw new BusinessException("Invalid or expired refresh token.");

        var storedToken = await _refreshTokenRepository.GetByTokenAsync(refreshToken, ct);

        if (storedToken is null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
            throw new BusinessException("Invalid or expired refresh token.");

        var user = await _userRepository.GetByIdAsync(storedToken.UserId, ct)
            ?? throw new NotFoundException(nameof(User), storedToken.UserId);

     
        if (!await _refreshTokenRepository.TryRevokeAsync(refreshToken, ct))
            throw new BusinessException("Invalid or expired refresh token.");
        return await GenerateAuthResponseAsync(user, ct);
    }

    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user, CancellationToken ct)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(15);

        var refreshTokenEntity = new RefreshToken
        {
            Token = rawRefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        await _refreshTokenRepository.CreateAsync(refreshTokenEntity, ct);

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            ExpiresAt: expiresAt,
            UserId: user.Id,
            UserName: user.Name,
            Email: user.Email,
            IsAdmin: user.IsAdmin
        );
    }
}
