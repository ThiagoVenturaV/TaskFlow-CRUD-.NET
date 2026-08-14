import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface UserResponse extends CurrentUser {
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
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  readonly currentUser = signal<CurrentUser | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.isAdmin === true);

  constructor() {
    this.removeLegacyPersistentTokens();
    this.loadUserFromSessionStorage();
  }

  register(data: unknown): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  login(credentials: unknown): Observable<AuthResponse> {
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
        const current: CurrentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        };
        sessionStorage.setItem('tf_user', JSON.stringify(current));
        this.currentUser.set(current);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('tf_access');
    sessionStorage.removeItem('tf_refresh');
    sessionStorage.removeItem('tf_user');
    this.removeLegacyPersistentTokens();
    this.currentUser.set(null);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('tf_access');
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem('tf_refresh');
  }

  private handleAuthSuccess(res: AuthResponse): void {
    sessionStorage.setItem('tf_access', res.accessToken);
    sessionStorage.setItem('tf_refresh', res.refreshToken);

    const user: CurrentUser = {
      id: res.userId,
      name: res.userName,
      email: res.email,
      isAdmin: res.isAdmin
    };
    sessionStorage.setItem('tf_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUserFromSessionStorage(): void {
    const userJson = sessionStorage.getItem('tf_user');
    if (!userJson) return;

    try {
      const parsed = JSON.parse(userJson) as Partial<CurrentUser>;
      if (!parsed.id || !parsed.email || typeof parsed.isAdmin !== 'boolean') {
        throw new Error('Invalid session user');
      }
      this.currentUser.set(parsed as CurrentUser);
    } catch {
      this.logout();
    }
  }

  private removeLegacyPersistentTokens(): void {
    localStorage.removeItem('tf_access');
    localStorage.removeItem('tf_refresh');
    localStorage.removeItem('tf_user');
  }
}
