import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);

  // Component Signals
  readonly usersList = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Modal Signals
  readonly showModal = signal(false);
  readonly isEditing = signal(false);
  readonly currentUserId = signal<string | null>(null);

  // Form Fields
  readonly formName = signal('');
  readonly formEmail = signal('');
  readonly formPassword = signal('');
  readonly formError = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAll().subscribe({
      next: (users) => {
        this.usersList.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Falha ao carregar a lista de usuários. Tente novamente mais tarde.');
        this.isLoading.set(false);
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

  openEditModal(user: User): void {
    this.isEditing.set(true);
    this.currentUserId.set(user.id);
    this.formName.set(user.name);
    this.formEmail.set(user.email);
    this.formPassword.set(''); // Password is not editable from here
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (!this.formName() || !this.formEmail()) {
      this.formError.set('Por favor, preencha os campos obrigatórios.');
      return;
    }

    if (!this.isEditing() && !this.formPassword()) {
      this.formError.set('A senha é obrigatória para novos usuários.');
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

  deleteUser(user: User): void {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.showSuccess(`Usuário ${user.name} excluído com sucesso.`);
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
