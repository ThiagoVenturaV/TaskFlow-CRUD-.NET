using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskFlow.Application.DTOs.Task;

public record CreateTaskDto(
    string Title,
    string? Description,
    DateTime DueDate,
    Guid UserId
);
