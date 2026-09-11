import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';

type SocialProvider = 'Google' | 'Facebook';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-[#fffdf7] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Register</p>
              <h1 class="mt-2 text-3xl font-bold">Create your account</h1>
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

          @if (success) {
            <div class="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {{ success }}
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
              (click)="socialRegister('Google')"
              class="flex items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs text-white">G</span>
              Google
            </button>
            <button
              type="button"
              (click)="socialRegister('Facebook')"
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

          <form (ngSubmit)="register()" #registerForm="ngForm" novalidate class="grid gap-4">
            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Full name
              <input
                type="text"
                name="name"
                [(ngModel)]="formData.name"
                required
                minlength="2"
                autocomplete="name"
                class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-500 focus:bg-white"
                placeholder="John Doe"
              />
            </label>

            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Email
              <input
                type="email"
                name="email"
                [(ngModel)]="formData.email"
                required
                email
                autocomplete="email"
                class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-500 focus:bg-white"
                placeholder="you@example.com"
              />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-2 text-sm font-bold text-slate-700">
                Password
                <input
                  type="password"
                  name="password"
                  [(ngModel)]="formData.password"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-500 focus:bg-white"
                  placeholder="6+ characters"
                />
              </label>

              <label class="grid gap-2 text-sm font-bold text-slate-700">
                Confirm
                <input
                  type="password"
                  name="confirmPassword"
                  [(ngModel)]="formData.confirmPassword"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-500 focus:bg-white"
                  placeholder="Repeat password"
                />
              </label>
            </div>

            <button
              type="submit"
              [disabled]="loading"
              class="mt-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {{ loading ? 'Creating account...' : 'Create account' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-600">
            Already registered?
            <a routerLink="/login" class="font-bold text-slate-950 hover:underline">Login</a>
          </p>
        </div>

        <div class="hidden lg:block">
          <a routerLink="/" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
            Back to store
          </a>
          <p class="mt-10 text-xs font-bold uppercase tracking-[0.35em] text-emerald-700">Join NovaMart</p>
          <h2 class="mt-4 max-w-xl text-6xl font-bold leading-tight">
            One account for carts, orders, and staff tools.
          </h2>
          <p class="mt-5 max-w-lg text-base leading-7 text-slate-600">
            After registration, Django prints your OTP in the backend terminal because this project uses the console email backend.
          </p>

          <div class="mt-8 rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-lg">
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">What works now</p>
            <ul class="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
              <li>Account creation through the Django API.</li>
              <li>Session login with cookies from Angular to Django.</li>
              <li>Staff dashboard access for users with staff permission.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [],
})
export class RegisterComponent {
  formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  error = '';
  success = '';
  message = '';
  loading = false;

  constructor(
    private storeService: StoreService,
    private router: Router,
  ) {}

  register(): void {
    this.error = '';
    this.success = '';
    this.message = '';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.formData.name.trim() || !this.formData.email.trim() || !this.formData.password) {
      this.error = 'Name, email, and password are required.';
      return;
    }

    if (!emailPattern.test(this.formData.email.trim())) {
      this.error = 'Enter a valid email address.';
      return;
    }

    if (this.formData.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.storeService
      .registerResult(this.formData.email, this.formData.password, this.formData.name)
      .subscribe((result) => {
        this.loading = false;
        if (result.success) {
          this.success = result.message;
          setTimeout(() => {
            void this.router.navigate(['/account']);
          }, 900);
          return;
        }
        this.error = result.message;
      });
  }

  socialRegister(provider: SocialProvider): void {
    this.error = '';
    this.success = '';
    this.message = `${provider} sign-up needs OAuth app credentials and a Django callback endpoint before it can be enabled.`;
  }
}
