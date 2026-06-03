using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskFlow.Application.DTOs.User;

public record CreateUserDto(
    string Name,
    string Email,
    string Password
);