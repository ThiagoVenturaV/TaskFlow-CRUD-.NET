import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, TaskItem, TaskItemStatus } from '../../core/services/task.service';
import { UserService, User } from '../../core/services/user.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);

  // Core Data Signals
  readonly tasksList = signal<TaskItem[]>([]);
  readonly usersList = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Filter Signals
  readonly selectedFilterUser = signal<string>('');

  // Modal Signals
  readonly showModal = signal(false);
  readonly isEditing = signal(false);
  readonly currentTaskId = signal<string | null>(null);

  // Form Fields
  readonly formTitle = signal('');
  readonly formDescription = signal('');
  readonly formStatus = signal<number>(0);
  readonly formDueDate = signal('');
  readonly formUserId = signal('');
  readonly formError = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  // Computed task items based on selected user filter
  readonly filteredTasks = computed(() => {
    const filter = this.selectedFilterUser();
    if (!filter) {
      return this.tasksList();
    }
    return this.tasksList().filter(t => t.userId === filter);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      tasks: this.taskService.getAll(),
      users: this.userService.getAll()
    }).subscribe({
      next: (res) => {
        this.tasksList.set(res.tasks);
        this.usersList.set(res.users);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar dados de tarefas. Verifique se o backend está rodando.');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentTaskId.set(null);
    this.formTitle.set('');
    this.formDescription.set('');
    this.formStatus.set(0); // Pending
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.formDueDate.set(tomorrow.toISOString().split('T')[0]);
    
    // Auto-select first user if available
    const users = this.usersList();
    this.formUserId.set(users.length > 0 ? users[0].id : '');
    
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEditModal(task: TaskItem): void {
    this.isEditing.set(true);
    this.currentTaskId.set(task.id);
    this.formTitle.set(task.title);
    this.formDescription.set(task.description || '');
    this.formStatus.set(task.status);
    
    // Format date for <input type="date">
    const dateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    this.formDueDate.set(dateStr);
    
    this.formUserId.set(task.userId);
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (!this.formTitle() || !this.formDueDate() || !this.formUserId()) {
      this.formError.set('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    // Prepare payload
    const payload = {
      title: this.formTitle(),
      description: this.formDescription() || null,
      dueDate: new Date(this.formDueDate()).toISOString(),
      userId: this.formUserId(),
      status: Number(this.formStatus())
    };

    if (this.isEditing() && this.currentTaskId()) {
      this.taskService.update(this.currentTaskId()!, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showSuccess('Tarefa atualizada com sucesso!');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.parseError(err, 'Erro ao atualizar tarefa.'));
        }
      });
    } else {
      this.taskService.create(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showSuccess('Tarefa criada com sucesso!');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.parseError(err, 'Erro ao criar tarefa.'));
        }
      });
    }
  }

  // Quick action reassignment
  onQuickReassign(task: TaskItem, event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const newUserId = selectEl.value;
    
    if (!newUserId || newUserId === task.userId) {
      return;
    }

    this.taskService.assignToUser(task.id, newUserId).subscribe({
      next: () => {
        this.showSuccess(`Tarefa "${task.title}" reatribuída com sucesso.`);
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(this.parseError(err, 'Erro ao reatribuir tarefa.'));
      }
    });
  }

  deleteTask(task: TaskItem): void {
    if (!confirm(`Deseja realmente excluir a tarefa "${task.title}"?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.taskService.delete(task.id).subscribe({
      next: () => {
        this.showSuccess(`Tarefa "${task.title}" excluída com sucesso.`);
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(this.parseError(err, `Erro ao excluir a tarefa "${task.title}".`));
      }
    });
  }

  getStatusClass(status: TaskItemStatus): string {
    switch (status) {
      case TaskItemStatus.Pending: return 'badge badge-pending';
      case TaskItemStatus.InProgress: return 'badge badge-progress';
      case TaskItemStatus.Done: return 'badge badge-done';
      case TaskItemStatus.Cancelled: return 'badge badge-cancelled';
      default: return 'badge';
    }
  }

  private parseError(err: any, defaultMsg: string): string {
    if (!err || !err.error) {
      return 'Erro inesperado. Verifique a conexão com o servidor.';
    }
    
    if (typeof err.error.error === 'string') {
      return err.error.error;
    }
    
    if (typeof err.error.message === 'string') {
      return err.error.message;
    }
    
    if (err.error.errors && typeof err.error.errors === 'object') {
      const messages: string[] = [];
      for (const key in err.error.errors) {
        if (Object.prototype.hasOwnProperty.call(err.error.errors, key)) {
          const fieldErrors = err.error.errors[key];
          if (Array.isArray(fieldErrors)) {
            messages.push(...fieldErrors);
          } else if (typeof fieldErrors === 'string') {
            messages.push(fieldErrors);
          }
        }
      }
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    
    return defaultMsg;
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 4000);
  }
}
