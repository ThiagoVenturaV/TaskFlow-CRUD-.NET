import { Component, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals for state management
  readonly email = signal('');
  readonly password = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  // Real-time validations
  readonly isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()));
  readonly isPasswordValid = computed(() => this.password().length > 0);
  readonly isFormValid = computed(() => this.isEmailValid() && this.isPasswordValid());

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage.set('Por favor, insira credenciais válidas.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email().trim(), password: this.password() }).subscribe({
      next: () => {
        this.isLoading.set(false);
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.parseError(err));
      }
    });
  }

  private parseError(err: any): string {
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
    
    return 'Falha na autenticação. Verifique seu e-mail e senha.';
  }
}
