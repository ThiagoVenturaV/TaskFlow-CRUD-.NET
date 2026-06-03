using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Domain.Entities;

sing TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Interfaces;

public interface IUserRepository
{
    Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User> CreateAsync(User user, CancellationToken ct = default);
    Task<User> UpdateAsync(User user, CancellationToken ct = default);
    Task DeleteAsync(User user, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> HasActiveTasksAsync(Guid userId, CancellationToken ct = default);
}
