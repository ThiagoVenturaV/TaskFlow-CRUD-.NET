using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Task;

public record TaskResponseDto(
    Guid Id,
    string Title,
    string? Description,
    TaskItemStatus Status,
    string StatusLabel,
    DateTime DueDate,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    Guid UserId,
    string UserName
);