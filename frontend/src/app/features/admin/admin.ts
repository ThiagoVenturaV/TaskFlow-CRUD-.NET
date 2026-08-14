import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserService, User } from '../../core/services/user.service';
import { TaskService, TaskItem, TaskItemStatus } from '../../core/services/task.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  // CRUD Data Signals
  readonly usersList = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Selected User Tasks Signals
  readonly selectedUser = signal<User | null>(null);
  readonly selectedUserTasks = signal<TaskItem[]>([]);
  readonly isTasksLoading = signal(false);

  // Tasks Columns for selected user
  readonly pendingTasks = computed(() => 
    this.selectedUserTasks().filter(t => t.status === TaskItemStatus.Pending)
  );
  readonly inProgressTasks = computed(() => 
    this.selectedUserTasks().filter(t => t.status === TaskItemStatus.InProgress)
  );
  readonly doneTasks = computed(() => 
    this.selectedUserTasks().filter(t => t.status === TaskItemStatus.Done)
  );
  readonly cancelledTasks = computed(() => 
    this.selectedUserTasks().filter(t => t.status === TaskItemStatus.Cancelled)
  );

  // CRUD Modal Signals
  readonly showModal = signal(false);
  readonly isEditing = signal(false);
  readonly currentUserId = signal<string | null>(null);

  // CRUD Form Fields
  readonly formName = signal('');
  readonly formEmail = signal('');
  readonly formPassword = signal('');
  readonly formError = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  // CRUD Form Validations
  readonly isNameValid = computed(() => this.formName().trim().length >= 3);
  readonly isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formEmail().trim()));
  readonly isPasswordLengthValid = computed(() => this.formPassword().length >= 12);
  readonly isPasswordUpperValid = computed(() => /[A-Z]/.test(this.formPassword()));
  readonly isPasswordNumberValid = computed(() => /[0-9]/.test(this.formPassword()));
  
  readonly isPasswordSecure = computed(() => 
    this.isPasswordLengthValid() && this.isPasswordUpperValid() && this.isPasswordNumberValid()
  );

  readonly isFormValid = computed(() => 
    this.isNameValid() && 
    this.isEmailValid() && 
    (this.isEditing() || this.isPasswordSecure())
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  // --- CRUD USER LOGIC ---
  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAll().subscribe({
      next: (users) => {
        this.usersList.set(users);
        this.isLoading.set(false);
        
        // If a user was selected, update their details or clear selection if no longer exists
        const currentSelected = this.selectedUser();
        if (currentSelected) {
          const updated = users.find(u => u.id === currentSelected.id);
          if (updated) {
            this.selectedUser.set(updated);
            this.loadUserTasks(updated);
          } else {
            this.selectedUser.set(null);
            this.selectedUserTasks.set([]);
          }
        }
      },
      error: () => {
        this.errorMessage.set('Falha ao carregar a lista de usuários. Tente novamente mais tarde.');
        this.isLoading.set(false);
      }
    });
  }

  selectUser(user: User): void {
    this.selectedUser.set(user);
    this.loadUserTasks(user);
  }

  loadUserTasks(user: User): void {
    this.isTasksLoading.set(true);
    this.taskService.getAll(user.id).subscribe({
      next: (tasks) => {
        this.selectedUserTasks.set(tasks);
        this.isTasksLoading.set(false);
      },
      error: () => {
        this.selectedUserTasks.set([]);
        this.isTasksLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentUserId.set(null);
    this.formName.set('');
    this.formEmail.set('');
    this.formPassword.set('');
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEditModal(user: User, event: Event): void {
    event.stopPropagation(); // Avoid selecting the card when clicking edit
    this.isEditing.set(true);
    this.currentUserId.set(user.id);
    this.formName.set(user.name);
    this.formEmail.set(user.email);
    this.formPassword.set('');
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.formError.set('Por favor, atenda a todos os requisitos de validação.');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    if (this.isEditing() && this.currentUserId()) {
      const payload = { name: this.formName(), email: this.formEmail() };
      this.userService.update(this.currentUserId()!, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showSuccess('Usuário atualizado com sucesso!');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.parseError(err, 'Erro ao atualizar usuário.'));
        }
      });
    } else {
      const payload = { name: this.formName(), email: this.formEmail(), password: this.formPassword() };
      this.userService.create(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showSuccess('Usuário cadastrado com sucesso!');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.parseError(err, 'Erro ao criar usuário.'));
        }
      });
    }
  }

  deleteUser(user: User, event: Event): void {
    event.stopPropagation(); // Avoid selecting the card
    if (user.id === this.authService.currentUser()?.id) {
      alert('Não é possível excluir a própria conta administrativa!');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.showSuccess(`Usuário ${user.name} excluído com sucesso.`);
        if (this.selectedUser()?.id === user.id) {
          this.selectedUser.set(null);
          this.selectedUserTasks.set([]);
        }
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage.set(this.parseError(err, `Erro ao excluir usuário ${user.name}.`));
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
