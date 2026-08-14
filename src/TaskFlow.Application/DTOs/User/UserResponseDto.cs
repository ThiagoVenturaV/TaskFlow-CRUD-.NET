using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskFlow.Application.DTOs.User;

public record UserResponseDto(
    Guid Id,
    string Name,
    string Email,
    bool IsAdmin,
    DateTime CreatedAt,
    int TaskCount
);
