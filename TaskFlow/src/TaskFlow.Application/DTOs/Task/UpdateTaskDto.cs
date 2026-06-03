using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Task;

public record UpdateTaskDto(
    string Title,
    string? Description,
    TaskItemStatus Status,
    DateTime DueDate,
    Guid UserId
);