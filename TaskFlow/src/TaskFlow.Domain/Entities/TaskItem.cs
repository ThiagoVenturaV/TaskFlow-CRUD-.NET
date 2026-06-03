using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;


public class TaskItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Pending;
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    
    public Guid UserId { get; set; }
    
    public User User { get; set; } = null!;

    
    public void AssignTo(Guid newUserId)
    {
        if (newUserId == Guid.Empty)
            throw new ArgumentException("UserId cannot be empty.", nameof(newUserId));
        UserId = newUserId;
        UpdatedAt = DateTime.UtcNow;
    }

    
    public void Update(string title, string? description, TaskItemStatus status, DateTime dueDate)
    {
        Title = title;
        Description = description;
        Status = status;
        DueDate = dueDate;
        UpdatedAt = DateTime.UtcNow;
    }
}