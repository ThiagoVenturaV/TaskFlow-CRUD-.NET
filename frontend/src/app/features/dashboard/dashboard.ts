import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User } from '../../core/services/user.service';
import { TaskService, TaskItem, TaskItemStatus } from '../../core/services/task.service';
import { AuthService } from '../../core/auth/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly userService = inject(UserService);
  private readonly taskService = inject(TaskService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Core signals
  readonly tasks = signal<TaskItem[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Trello Columns computed signals
  readonly pendingTasks = computed(() => 
    this.tasks().filter(t => t.status === TaskItemStatus.Pending)
  );
  readonly inProgressTasks = computed(() => 
    this.tasks().filter(t => t.status === TaskItemStatus.InProgress)
  );
  readonly doneTasks = computed(() => 
    this.tasks().filter(t => t.status === TaskItemStatus.Done)
  );
  readonly cancelledTasks = computed(() => 
    this.tasks().filter(t => t.status === TaskItemStatus.Cancelled)
  );

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

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.isLoading.set(false);
      return;
    }

    // Since it's individual, we only query tasks for the logged in user
    this.taskService.getAll(currentUser.id).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar suas tarefas. Verifique se o servidor está rodando.');
        this.isLoading.set(false);
      }
    });
  }

  // Modal actions
  openCreateModal(initialStatus: number = 0): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.isEditing.set(false);
    this.currentTaskId.set(null);
    this.formTitle.set('');
    this.formDescription.set('');
    this.formStatus.set(initialStatus);
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.formDueDate.set(tomorrow.toISOString().split('T')[0]);
    
    // Auto-assign to current logged in user (individual mode)
    this.formUserId.set(currentUser.id);
    
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEditModal(task: TaskItem): void {
    this.isEditing.set(true);
    this.currentTaskId.set(task.id);
    this.formTitle.set(task.title);
    this.formDescription.set(task.description || '');
    this.formStatus.set(task.status);
    
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

  deleteTask(task: TaskItem): void {
    if (!confirm(`Deseja realmente excluir a tarefa "${task.title}"?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.taskService.delete(task.id).subscribe({
      next: () => {
        this.showSuccess('Tarefa excluída com sucesso.');
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(this.parseError(err, `Erro ao excluir a tarefa "${task.title}".`));
      }
    });
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
