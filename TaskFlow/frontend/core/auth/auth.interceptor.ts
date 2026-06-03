import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  let authReq = req;
  const isAuthRequest = req.url.includes('/api/auth/') && !req.url.includes('/api/auth/me');

  if (token && !isAuthRequest) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se não for rota de auth e for 401, tenta refresh silencioso
      if (error.status === 401 && !isAuthRequest && authService.getRefreshToken()) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const newReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`)
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            authService.logout();
            if (!router.url.includes('/admin')) {
              router.navigate(['/login']);
            }
            return throwError(() => refreshError);
          })
        );
      }
      
      // Se falhar e não puder realizar refresh, remove sessão local
      if (error.status === 401 && !isAuthRequest) {
        authService.logout();
        if (!router.url.includes('/admin')) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};