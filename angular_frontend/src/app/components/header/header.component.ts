import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StoreService } from '../../services/store.service';
import { User } from '../../models/ecommerce.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div class="section-shell">
        <div class="flex min-h-20 items-center gap-4 py-3">
          <a routerLink="/" class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 text-lg font-bold text-slate-950 shadow-lg"
            >
              
            </div>
            <div class="min-w-0">
              <p class="truncate text-lg font-bold text-slate-950">Medusa</p>
              <p class="truncate text-xs uppercase tracking-[0.28em] text-slate-500">
                Curated lifestyle gear
              </p>
            </div>
          </a>

          <div class="hidden flex-1 items-center gap-3 lg:flex ">
           

            <nav class="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              @for (link of navLinks; track link.path) {
                <a
                  [routerLink]="link.path"
                  routerLinkActive="bg-slate-950 text-white"
                  [routerLinkActiveOptions]="{ exact: link.exact }"
                  class="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  {{ link.label }}
                </a>
              }
            </nav>
          </div>

          <div class="ml-auto hidden items-center gap-3 md:flex">
            <a
              routerLink="/cart"
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cart <span class="text-red-600">{{ cartItemCount > 0 ? '(' + cartItemCount + ')' : '' }}</span>
            </a>

            @if (isLoggedIn && user) {
              @if (user.isStaff) {
                <a
                  routerLink="/dashboard"
                  class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Dashboard
                </a>
              }
              <a
                routerLink="/account"
                class="flex items-center gap-3 rounded-full bg-slate-950 px-4 py-2 text-white shadow-lg"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950"
                >
                  {{ getInitials() }}
                </span>
                <span class="max-w-24 truncate text-sm font-semibold">{{ user.name }}</span>
              </a>
            } @else {
              <a
                routerLink="/login"
                class="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </a>
              <a
                routerLink="/register"
                class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Join
              </a>
            }
          </div>

          <button
            type="button"
            class="ml-auto rounded-2xl border border-slate-200 p-3 text-slate-700 md:hidden"
            (click)="toggleMobileMenu()"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>

        @if (mobileMenuOpen) {
          <div class="grid gap-4 border-t border-slate-200 py-4 md:hidden">
            <form
              class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
              (ngSubmit)="searchProducts(); closeMobileMenu()"
            >
              <input
                type="text"
                name="mobileSearch"
                [(ngModel)]="searchTerm"
                placeholder="Search products"
                class="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <button type="submit" class="text-sm font-semibold text-slate-700">Go</button>
            </form>

            <nav class="grid gap-2">
              @for (link of navLinks; track link.path) {
                <a
                  [routerLink]="link.path"
                  (click)="closeMobileMenu()"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700"
                >
                  {{ link.label }}
                </a>
              }
            </nav>

            <div class="grid gap-2">
              <a
                routerLink="/cart"
                (click)="closeMobileMenu()"
                class="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white"
              >
                Cart {{ cartItemCount > 0 ? '(' + cartItemCount + ')' : '' }}
              </a>

              @if (isLoggedIn && user) {
                @if (user.isStaff) {
                  <a
                    routerLink="/dashboard"
                    (click)="closeMobileMenu()"
                    class="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700"
                  >
                    Dashboard
                  </a>
                }
                <a
                  routerLink="/account"
                  (click)="closeMobileMenu()"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700"
                >
                  Account: {{ user.name }}
                </a>
                <button
                  type="button"
                  (click)="logout()"
                  class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left font-semibold text-rose-700"
                >
                  Logout
                </button>
              } @else {
                <a
                  routerLink="/login"
                  (click)="closeMobileMenu()"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700"
                >
                  Login
                </a>
                <a
                  routerLink="/register"
                  (click)="closeMobileMenu()"
                  class="rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950"
                >
                  Create account
                </a>
              }
            </div>
          </div>
        }
      </div>
    </header>
  `,
  styles: [],
})
export class HeaderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly storeService = inject(StoreService);
  private readonly router = inject(Router);

  readonly navLinks = [
    { path: '/', label: 'Home', exact: true },
    { path: '/products', label: 'Products', exact: false },
    { path: '/your-orders', label: 'Your Orders', exact: false },
    { path: '/contact', label: 'Contact', exact: false },
  ];

  user: User | null = this.storeService.getCurrentUser();
  isLoggedIn = this.storeService.isLoggedIn();
  mobileMenuOpen = false;
  cartItemCount = this.storeService.getCartItemCount();
  searchTerm = '';

  ngOnInit(): void {
    this.storeService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!user;
    });

    this.storeService.cart$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cart) => {
      this.cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
    });
  }

  getInitials(): string {
    return this.user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  searchProducts(): void {
    void this.router.navigate(['/products'], {
      queryParams: {
        search: this.searchTerm.trim() || null,
      },
    });
  }

  logout(): void {
    this.storeService.logout();
    this.mobileMenuOpen = false;
    void this.router.navigate(['/']);
  }
}
