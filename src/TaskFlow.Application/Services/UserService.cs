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
        if (await _userRepository.ExistsByEmailAsync(dto.Email, ct))
            throw new ConflictException($"Email '{dto.Email}' is already registered.");

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        var created = await _userRepository.CreateAsync(user, ct);
        return created.ToResponseDto();
    }

    public async Task<UserResponseDto> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(User), id);

       
        if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await _userRepository.ExistsByEmailAsync(dto.Email, ct))
                throw new ConflictException($"Email '{dto.Email}' is already in use.");
        }

        user.Name = dto.Name;
        user.Email = dto.Email;
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
