using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskFlow.Domain.Enums;



public enum TaskItemStatus
{
    
    Pending = 0,
    
    InProgress = 1,
    
    Done = 2,
    
    Cancelled = 3
}