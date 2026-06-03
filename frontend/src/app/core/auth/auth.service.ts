import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  taskCount: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  userName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/auth';

  // Signals to track authentication state
  readonly currentUser = signal<{ id: string; name: string; email: string } | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.email === 'admin@taskflow.com');

  constructor() {
    this.loadUserFromLocalStorage();
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getRefreshToken();
    if (!token) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken: token }).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        const current = this.currentUser();
        if (current) {
          this.currentUser.set({
            ...current,
            name: user.name,
            email: user.email
          });
          localStorage.setItem('tf_user', JSON.stringify(this.currentUser()));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('tf_access');
    localStorage.removeItem('tf_refresh');
    localStorage.removeItem('tf_user');
    this.currentUser.set(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('tf_access');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('tf_refresh');
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('tf_access', res.accessToken);
    localStorage.setItem('tf_refresh', res.refreshToken);
    
    const user = { id: res.userId, name: res.userName, email: res.email };
    localStorage.setItem('tf_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUserFromLocalStorage(): void {
    const userJson = localStorage.getItem('tf_user');
    if (userJson) {
      try {
        this.currentUser.set(JSON.parse(userJson));
      } catch {
        this.logout();
      }
    }
  }
}
