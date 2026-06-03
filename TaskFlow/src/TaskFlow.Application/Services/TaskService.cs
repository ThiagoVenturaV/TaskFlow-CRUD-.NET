using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Application.DTOs.Task;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Mappings;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Exceptions;

namespace TaskFlow.Application.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IUserRepository _userRepository;

    public TaskService(ITaskRepository taskRepository, IUserRepository userRepository)
    {
        _taskRepository = taskRepository;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<TaskResponseDto>> GetAllAsync(Guid? userId = null, CancellationToken ct = default)
    {
        var tasks = userId.HasValue
            ? await _taskRepository.GetByUserIdAsync(userId.Value, ct)
            : await _taskRepository.GetAllAsync(ct);

        return tasks.ToResponseDtoList();
    }

    public async Task<TaskResponseDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var task = await _taskRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(TaskItem), id);
        return task.ToResponseDto();
    }

    public async Task<TaskResponseDto> CreateAsync(CreateTaskDto dto, CancellationToken ct = default)
    {
        
        var userExists = await _userRepository.GetByIdAsync(dto.UserId, ct);
        if (userExists is null)
            throw new NotFoundException(nameof(User), dto.UserId);

        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            UserId = dto.UserId
        };

        var created = await _taskRepository.CreateAsync(task, ct);
       
        var reloaded = await _taskRepository.GetByIdAsync(created.Id, ct);
        return reloaded!.ToResponseDto();
    }

    public async Task<TaskResponseDto> UpdateAsync(Guid id, UpdateTaskDto dto, CancellationToken ct = default)
    {
        var task = await _taskRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(TaskItem), id);

        
        if (task.UserId != dto.UserId)
        {
            var userExists = await _userRepository.GetByIdAsync(dto.UserId, ct);
            if (userExists is null)
                throw new NotFoundException(nameof(User), dto.UserId);
        }

        task.Update(dto.Title, dto.Description, dto.Status, dto.DueDate);
        task.UserId = dto.UserId;

        var updated = await _taskRepository.UpdateAsync(task, ct);
        var reloaded = await _taskRepository.GetByIdAsync(updated.Id, ct);
        return reloaded!.ToResponseDto();
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var task = await _taskRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(TaskItem), id);
        await _taskRepository.DeleteAsync(task, ct);
    }

    public async Task<TaskResponseDto> AssignToUserAsync(Guid taskId, Guid userId, CancellationToken ct = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, ct)
            ?? throw new NotFoundException(nameof(TaskItem), taskId);

        _ = await _userRepository.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException(nameof(User), userId);

      
        task.AssignTo(userId);

        var updated = await _taskRepository.UpdateAsync(task, ct);
        var reloaded = await _taskRepository.GetByIdAsync(updated.Id, ct);
        return reloaded!.ToResponseDto();
    }
}
