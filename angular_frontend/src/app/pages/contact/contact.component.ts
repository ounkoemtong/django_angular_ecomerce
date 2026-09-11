import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="section-shell py-8 sm:py-10">
      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="glass-panel rounded-[36px] p-6 sm:p-8">
          <p class="eyebrow">Support</p>
          <h1 class="mt-2 text-4xl font-bold text-slate-950">Reach the team behind the store.</h1>
          <p class="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            Use the form for orders, product questions, or bulk purchase requests. The contact page now behaves like the rest of the app instead of feeling like a placeholder.
          </p>

          <form (ngSubmit)="submitForm()" #contactForm="ngForm" class="mt-8 space-y-4">
            <input
              type="text"
              name="name"
              [(ngModel)]="formData.name"
              required
              placeholder="Your name"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            />
            <input
              type="email"
              name="email"
              [(ngModel)]="formData.email"
              required
              placeholder="Email"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            />
            <input
              type="text"
              name="subject"
              [(ngModel)]="formData.subject"
              required
              placeholder="Subject"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            />
            <textarea
              name="message"
              [(ngModel)]="formData.message"
              required
              rows="6"
              placeholder="What do you need help with?"
              class="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 outline-none"
            ></textarea>

            <button
              type="submit"
              [disabled]="contactForm.invalid || loading"
              class="rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
            >
              {{ loading ? 'Sending...' : 'Send message' }}
            </button>
          </form>

          @if (submitted) {
            <div class="mt-5 rounded-[24px] bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Message sent to Telegram.
            </div>
          }

          @if (error) {
            <div class="mt-5 rounded-[24px] bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {{ error }}
            </div>
          }
        </div>

        <div class="space-y-4">
          <div class="rounded-[32px] bg-slate-950 p-6 text-white">
            <p class="eyebrow text-slate-400">Direct channels</p>
            <div class="mt-5 space-y-4 text-sm text-slate-300">
              <p>support@novamart.shop</p>
              <p>+1 (555) 123-4567</p>
              <p>123 Commerce Street, New York, NY</p>
            </div>
          </div>

          <div class="glass-panel rounded-[32px] p-6">
            <p class="eyebrow">Response times</p>
            <div class="mt-5 space-y-4 text-sm text-slate-600">
              <div class="flex justify-between">
                <span>Order issues</span>
                <span class="font-bold text-slate-950">Under 2 hours</span>
              </div>
              <div class="flex justify-between">
                <span>Pre-sale questions</span>
                <span class="font-bold text-slate-950">Same day</span>
              </div>
              <div class="flex justify-between">
                <span>Returns support</span>
                <span class="font-bold text-slate-950">1 business day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [],
})
export class ContactComponent {
  private readonly apiService = inject(ApiService);

  formData = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };

  loading = false;
  submitted = false;
  error = '';

  submitForm(): void {
    this.loading = true;
    this.submitted = false;
    this.error = '';

    this.apiService
      .notifyContactMessage(this.formData)
      .pipe(catchError(() => of({ sent: false, message: 'Could not send your message right now.' })))
      .subscribe((result) => {
        this.loading = false;
        if (!result.sent) {
          this.error = result.message;
          return;
        }

        this.submitted = true;
        this.formData = { name: '', email: '', subject: '', message: '' };
        setTimeout(() => {
          this.submitted = false;
        }, 3000);
      });
  }
}
