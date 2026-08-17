import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const RoleGuard = (expectedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const role = authService.getUserRole();
    if (authService.isLoggedIn() && expectedRoles.includes(role)) {
      return true;
    }
    router.navigate(['/login']);
    return false;
  };
};
