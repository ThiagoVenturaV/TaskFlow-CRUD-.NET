using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Application.DTOs.Task;

namespace TaskFlow.Application.Interfaces;

public interface ITaskService
{
    Task<IEnumerable<TaskResponseDto>> GetAllAsync(Guid? userId = null, CancellationToken ct = default);
    Task<TaskResponseDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TaskResponseDto> CreateAsync(CreateTaskDto dto, CancellationToken ct = default);
    Task<TaskResponseDto> UpdateAsync(Guid id, UpdateTaskDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<TaskResponseDto> AssignToUserAsync(Guid taskId, Guid userId, CancellationToken ct = default);
}