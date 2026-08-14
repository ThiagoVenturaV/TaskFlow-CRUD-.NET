using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _context;

    public RefreshTokenRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct = default)
    {
        var tokenHash = HashToken(token);
        return await _context.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(rt => rt.Token == tokenHash || rt.Token == token, ct);
    }

    public async Task CreateAsync(RefreshToken refreshToken, CancellationToken ct = default)
    {
        refreshToken.Token = HashToken(refreshToken.Token);
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<bool> TryRevokeAsync(string token, CancellationToken ct = default)
    {
        var tokenHash = HashToken(token);
        var updated = await _context.RefreshTokens
            .Where(rt => (rt.Token == tokenHash || rt.Token == token) &&
                         !rt.IsRevoked && rt.ExpiresAt >= DateTime.UtcNow)
            .ExecuteUpdateAsync(setters => setters.SetProperty(rt => rt.IsRevoked, true), ct);
        return updated == 1;
    }

    public async Task RevokeAllByUserAsync(Guid userId, CancellationToken ct = default)
    {
        await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ExecuteUpdateAsync(setters => setters.SetProperty(rt => rt.IsRevoked, true), ct);
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
