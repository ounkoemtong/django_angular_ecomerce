import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';

type SocialProvider = 'Google' | 'Facebook';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-[#fffdf7] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="hidden lg:block">
          <a routerLink="/" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
            Back to store
          </a>
          <p class="mt-10 text-xs font-bold uppercase tracking-[0.35em] text-amber-600">NovaMart account</p>
          <h1 class="mt-4 max-w-xl text-6xl font-bold leading-tight">
            Welcome back to your shopping command center.
          </h1>
          <p class="mt-5 max-w-lg text-base leading-7 text-slate-600">
            Sign in to keep checkout fast, review your cart, and unlock the staff dashboard when your account has staff access.
          </p>

          <div class="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-3xl font-bold">Fast</p>
              <p class="mt-2 text-sm text-slate-500">Session-backed checkout</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-3xl font-bold">Live</p>
              <p class="mt-2 text-sm text-slate-500">Django API catalog</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-3xl font-bold">Staff</p>
              <p class="mt-2 text-sm text-slate-500">Dashboard ready</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Login</p>
              <h2 class="mt-2 text-3xl font-bold">Access your account</h2>
            </div>
            <a routerLink="/" class="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 lg:hidden">
              Home
            </a>
          </div>

          @if (error) {
            <div class="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {{ error }}
            </div>
          }

          @if (message) {
            <div class="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {{ message }}
            </div>
          }

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              (click)="socialLogin('Google')"
              class="flex items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs text-white">G</span>
              Google
            </button>
            <button
              type="button"
              (click)="socialLogin('Facebook')"
              class="flex items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877f2] text-xs text-white">f</span>
              Facebook
            </button>
          </div>

          <div class="my-6 flex items-center gap-3">
            <span class="h-px flex-1 bg-slate-200"></span>
            <span class="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">or</span>
            <span class="h-px flex-1 bg-slate-200"></span>
          </div>

          <form (ngSubmit)="login()" #loginForm="ngForm" novalidate class="grid gap-4">
            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Email or username
              <input
                type="text"
                name="identifier"
                [(ngModel)]="credentials.identifier"
                required
                autocomplete="username"
                class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-500 focus:bg-white"
                placeholder="you@example.com"
              />
            </label>

            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Password
              <input
                type="password"
                name="password"
                [(ngModel)]="credentials.password"
                required
                minlength="6"
                autocomplete="current-password"
                class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-500 focus:bg-white"
                placeholder="At least 6 characters"
              />
            </label>

            <button
              type="submit"
              [disabled]="loading"
              class="mt-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {{ loading ? 'Checking account...' : 'Login' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-600">
            No account yet?
            <a routerLink="/register" class="font-bold text-slate-950 hover:underline">Create one</a>
          </p>
        </div>
      </section>
    </main>
  `,
  styles: [],
})
export class LoginComponent {
  credentials = { identifier: '', password: '' };
  error = '';
  message = '';
  loading = false;

  constructor(
    private storeService: StoreService,
    private router: Router,
  ) {}

  login(): void {
    this.error = '';
    this.message = '';

    if (!this.credentials.identifier.trim() || !this.credentials.password) {
      this.error = 'Enter your email or username and password.';
      return;
    }

    if (this.credentials.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;
    this.storeService.loginResult(this.credentials.identifier, this.credentials.password).subscribe((result) => {
      this.loading = false;
      if (result.success) {
        void this.router.navigate(['/account']);
        return;
      }
      this.error = result.message;
    });
  }

  socialLogin(provider: SocialProvider): void {
    this.error = '';
    this.message = `${provider} sign-in needs OAuth app credentials and a Django callback endpoint before it can be enabled.`;
  }
}
