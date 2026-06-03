using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskFlow.Application.DTOs.Auth;

public record LoginDto(
    string Email,
    string Password
);
