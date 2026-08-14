using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Application.DTOs.Task;
using TaskFlow.Application.DTOs.User;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Mappings;


public static class MappingExtensions
{

    public static UserResponseDto ToResponseDto(this User user) =>
        new(
            Id: user.Id,
            Name: user.Name,
            Email: user.Email,
            IsAdmin: user.IsAdmin,
            CreatedAt: user.CreatedAt,
            TaskCount: user.Tasks?.Count ?? 0
        );

    public static IEnumerable<UserResponseDto> ToResponseDtoList(this IEnumerable<User> users) =>
        users.Select(u => u.ToResponseDto());

   

    public static TaskResponseDto ToResponseDto(this TaskItem task) =>
        new(
            Id: task.Id,
            Title: task.Title,
            Description: task.Description,
            Status: task.Status,
            StatusLabel: task.Status.ToString(),
            DueDate: task.DueDate,
            CreatedAt: task.CreatedAt,
            UpdatedAt: task.UpdatedAt,
            UserId: task.UserId,
            UserName: task.User?.Name ?? string.Empty
        );

    public static IEnumerable<TaskResponseDto> ToResponseDtoList(this IEnumerable<TaskItem> tasks) =>
        tasks.Select(t => t.ToResponseDto());
}
