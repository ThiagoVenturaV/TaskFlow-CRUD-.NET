using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Interfaces;

public interface ITaskRepository
{
    Task<IEnumerable<TaskItem>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<TaskItem>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TaskItem> CreateAsync(TaskItem task, CancellationToken ct = default);
    Task<TaskItem> UpdateAsync(TaskItem task, CancellationToken ct = default);
    Task DeleteAsync(TaskItem task, CancellationToken ct = default);
}
