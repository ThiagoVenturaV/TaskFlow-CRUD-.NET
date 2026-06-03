using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskFlow.Domain.Enums
/// <summary>
/// Lifecycle states a task can be in.
/// </summary>
public enum TaskItemStatus
{
    /// <summary>Task created but not yet started.</summary>
    Pending = 0,
    /// <summary>Task is actively being worked on.</summary>
    InProgress = 1,
    /// <summary>Task has been completed.</summary>
    Done = 2,
    /// <summary>Task was cancelled before completion.</summary>
    Cancelled = 3
}