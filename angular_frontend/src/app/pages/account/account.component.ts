import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../models/ecommerce.model';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="section-shell py-8 sm:py-10">
      @if (!isLoggedIn || !user) {
        <div class="glass-panel rounded-[36px] p-10 text-center">
          <h1 class="text-4xl font-bold text-slate-950">Sign in to unlock your account dashboard.</h1>
          <p class="mt-3 text-sm text-slate-500">Orders, spending, and profile context are stored per session here.</p>
          <a routerLink="/login" class="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 font-bold text-white">
            Login
          </a>
        </div>
      } @else {
        <div class="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <aside class="glass-panel rounded-[36px] p-6 sm:p-8">
            <div class="flex items-center gap-4">
              <div class="flex h-18 w-18 items-center justify-center rounded-full bg-slate-950 text-2xl font-bold text-white">
                {{ getUserInitial() }}
              </div>
              <div>
                <p class="text-2xl font-bold text-slate-950">{{ user.name }}</p>
                <p class="text-sm text-slate-500">{{ user.email }}</p>
              </div>
            </div>

            <div class="mt-8 grid gap-3">
              <a routerLink="/orders" class="rounded-[24px] border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-700">
                View orders
              </a>
              <a routerLink="/contact" class="rounded-[24px] border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-700">
                Contact support
              </a>
              <button
                type="button"
                (click)="logout()"
                class="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-left font-semibold text-rose-700"
              >
                Logout
              </button>
            </div>
          </aside>

          <div class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <div class="metric-card">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Member since</p>
                <p class="mt-2 text-2xl font-bold text-slate-950">{{ user.memberSince }}</p>
              </div>
              <div class="metric-card">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Orders placed</p>
                <p class="mt-2 text-2xl font-bold text-slate-950">{{ totalOrders }}</p>
              </div>
              <div class="metric-card">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Lifetime spend</p>
                <p class="mt-2 text-2xl font-bold text-slate-950">{{ lifetimeSpend | currency: 'USD' }}</p>
              </div>
            </div>

            <div class="glass-panel rounded-[32px] p-6 sm:p-8">
              <p class="eyebrow">Profile</p>
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p class="text-sm text-slate-500">Full name</p>
                  <p class="mt-1 text-lg font-bold text-slate-950">{{ user.name }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Email address</p>
                  <p class="mt-1 text-lg font-bold text-slate-950">{{ user.email }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Average order value</p>
                  <p class="mt-1 text-lg font-bold text-slate-950">{{ averageOrderValue | currency: 'USD' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Current cart count</p>
                  <p class="mt-1 text-lg font-bold text-slate-950">{{ cartItemCount }}</p>
                </div>
              </div>
            </div>

            <div class="glass-panel rounded-[32px] p-6 sm:p-8">
              <p class="eyebrow">Status</p>
              <h2 class="mt-2 text-2xl font-bold text-slate-950">Account is active and checkout-ready.</h2>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Your session profile is connected to the Django API, while cart and checkout history stay available in this browser session.
              </p>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [],
})
export class AccountComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly storeService = inject(StoreService);
  private readonly router = inject(Router);

  isLoggedIn = false;
  user: User | null = null;
  totalOrders = 0;
  cartItemCount = 0;
  lifetimeSpend = 0;
  averageOrderValue = 0;

  ngOnInit(): void {
    this.syncSnapshot();

    this.storeService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!user;
    });

    this.storeService.orders$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((orders) => {
      this.totalOrders = orders.length;
      this.lifetimeSpend = this.storeService.getLifetimeSpend();
      this.averageOrderValue = this.storeService.getAverageOrderValue();
    });

    this.storeService.cart$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cart) => {
      this.cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
    });
  }

  syncSnapshot(): void {
    this.user = this.storeService.getCurrentUser();
    this.isLoggedIn = this.storeService.isLoggedIn();
    this.totalOrders = this.storeService.getOrders().length;
    this.cartItemCount = this.storeService.getCartItemCount();
    this.lifetimeSpend = this.storeService.getLifetimeSpend();
    this.averageOrderValue = this.storeService.getAverageOrderValue();
  }

  getUserInitial(): string {
    return this.user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  }

  logout(): void {
    this.storeService.logout();
    void this.router.navigate(['/']);
  }
}
