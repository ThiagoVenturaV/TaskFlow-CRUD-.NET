using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Application.DTOs.User;

namespace TaskFlow.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserResponseDto>> GetAllAsync(CancellationToken ct = default);
    Task<UserResponseDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserResponseDto> CreateAsync(CreateUserDto dto, CancellationToken ct = default);
    Task<UserResponseDto> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
