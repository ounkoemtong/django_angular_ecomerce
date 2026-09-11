import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { StoreService } from '../services/store.service';

export const authGuard: CanActivateFn = () => {
  const storeService = inject(StoreService);
  const router = inject(Router);

  return storeService
    .validateSession()
    .pipe(map((isValid) => (isValid ? true : router.createUrlTree(['/login']))));
};

export const staffGuard: CanActivateFn = () => {
  const storeService = inject(StoreService);
  const router = inject(Router);

  return storeService.validateSession().pipe(
    map((isValid) => {
      if (!isValid) {
        return router.createUrlTree(['/login']);
      }
      return storeService.getCurrentUser()?.isStaff ? true : router.createUrlTree(['/account']);
    }),
  );
};
