import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html'
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals for registration form
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  // Real-time signals validation
  readonly isNameValid = computed(() => this.name().trim().length >= 3);
  readonly isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()));
  
  readonly isPasswordLengthValid = computed(() => this.password().length >= 12);
  readonly isPasswordUpperValid = computed(() => /[A-Z]/.test(this.password()));
  readonly isPasswordNumberValid = computed(() => /[0-9]/.test(this.password()));
  
  readonly isPasswordSecure = computed(() => 
    this.isPasswordLengthValid() && this.isPasswordUpperValid() && this.isPasswordNumberValid()
  );

  readonly isFormValid = computed(() => 
    this.isNameValid() && this.isEmailValid() && this.isPasswordSecure()
  );

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage.set('Por favor, atenda a todos os requisitos de validação.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.name().trim(),
      email: this.email().trim(),
      password: this.password()
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
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
    
    // Custom error format from middleware: { error: "..." }
    if (typeof err.error.error === 'string') {
      return err.error.error;
    }
    
    // Custom error format: { message: "..." }
    if (typeof err.error.message === 'string') {
      return err.error.message;
    }
    
    // Standard RFC problem details: { errors: { Field: ["error1", "error2"] } }
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
    
    return 'Erro ao criar conta. O e-mail informado já pode estar em uso.';
  }
}
