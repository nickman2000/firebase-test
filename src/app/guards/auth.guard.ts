import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (!authService.isLoading()) {
          if (authService.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (!authService.isLoading()) {
          if (authService.isAuthenticated()) {
            router.navigate(['/main-page']);
            resolve(false);
          } else {
            resolve(true);
          }
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  if (authService.isAuthenticated()) {
    router.navigate(['/main-page']);
    return false;
  }

  return true;
};