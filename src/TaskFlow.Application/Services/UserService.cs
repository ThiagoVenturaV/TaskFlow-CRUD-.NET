using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TaskFlow.Application.DTOs.User;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Mappings;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Application.Services;


public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserResponseDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await _userRepository.GetAllAsync(ct);
        return users.ToResponseDtoList();
    }

    public async Task<UserResponseDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(User), id);
        return user.ToResponseDto();
    }

    public async Task<UserResponseDto> CreateAsync(CreateUserDto dto, CancellationToken ct = default)
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
        return created.ToResponseDto();
    }

    public async Task<UserResponseDto> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(User), id);

       
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            if (await _userRepository.ExistsByEmailAsync(normalizedEmail, ct))
                throw new ConflictException("Email is already in use.");
        }

        user.Name = dto.Name.Trim();
        user.Email = normalizedEmail;
        user.UpdatedAt = DateTime.UtcNow;

        var updated = await _userRepository.UpdateAsync(user, ct);
        return updated.ToResponseDto();
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(User), id);

        if (await _userRepository.HasActiveTasksAsync(id, ct))
            throw new BusinessException("Cannot delete a user with active tasks. Reassign or delete their tasks first.");

        await _userRepository.DeleteAsync(user, ct);
    }
}
