FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/TaskFlow.API/TaskFlow.API.csproj", "src/TaskFlow.API/"]
COPY ["src/TaskFlow.Application/TaskFlow.Application.csproj", "src/TaskFlow.Application/"]
COPY ["src/TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj", "src/TaskFlow.Infrastructure/"]
COPY ["src/TaskFlow.Domain/TaskFlow.Domain.csproj", "src/TaskFlow.Domain/"]
RUN dotnet restore "src/TaskFlow.API/TaskFlow.API.csproj"
COPY . .
WORKDIR "/src/src/TaskFlow.API"
RUN dotnet build "TaskFlow.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TaskFlow.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TaskFlow.API.dll"]