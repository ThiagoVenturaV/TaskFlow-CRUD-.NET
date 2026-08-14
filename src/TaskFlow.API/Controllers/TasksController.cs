using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using TaskFlow.Application.DTOs.Task;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.API.Controllers;


[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TaskResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] Guid? userId, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var currentUserId)) return Unauthorized();
        var tasks = await _taskService.GetAllAsync(User.IsInRole("Admin") ? userId : currentUserId, ct);
        return Ok(tasks);
    }

    
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TaskResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var task = await _taskService.GetByIdAsync(id, ct);
        if (!CanAccess(task.UserId)) return Forbid();
        return Ok(task);
    }

    
    [HttpPost]
    [ProducesResponseType(typeof(TaskResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateTaskDto dto, CancellationToken ct)
    {
        if (!CanAccess(dto.UserId)) return Forbid();
        var task = await _taskService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
    }

    
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TaskResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskDto dto, CancellationToken ct)
    {
        var existing = await _taskService.GetByIdAsync(id, ct);
        if (!CanAccess(existing.UserId) || !CanAccess(dto.UserId)) return Forbid();
        var task = await _taskService.UpdateAsync(id, dto, ct);
        return Ok(task);
    }

    
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var existing = await _taskService.GetByIdAsync(id, ct);
        if (!CanAccess(existing.UserId)) return Forbid();
        await _taskService.DeleteAsync(id, ct);
        return NoContent();
    }

    
    [HttpPatch("{id:guid}/assign/{userId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TaskResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign(Guid id, Guid userId, CancellationToken ct)
    {
        var task = await _taskService.AssignToUserAsync(id, userId, ct);
        return Ok(task);
    }

    private bool CanAccess(Guid ownerId) =>
        User.IsInRole("Admin") || (TryGetCurrentUserId(out var currentUserId) && currentUserId == ownerId);

    private bool TryGetCurrentUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sub), out userId);
}
