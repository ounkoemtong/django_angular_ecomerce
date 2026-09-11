import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CartItem } from '../../models/ecommerce.model';
import { StoreService } from '../../services/store.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="section-shell py-8 sm:py-10">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Checkout</p>
          <h1 class="mt-2 text-4xl font-bold text-slate-950">Confirm details and place the order.</h1>
        </div>
        <a routerLink="/cart" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
          Back to cart
        </a>
      </div>

      @if (cartItems.length === 0) {
        <div class="glass-panel mt-8 rounded-[36px] p-10 text-center">
          <h2 class="text-3xl font-bold text-slate-950">Nothing to check out yet.</h2>
          <p class="mt-3 text-sm text-slate-500">Build your cart first, then return here to complete the order.</p>
          <a
            routerLink="/products"
            class="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 font-bold text-white"
          >
            View products
          </a>
        </div>
      } @else {
        <div class="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <form (ngSubmit)="placeOrder()" #checkoutForm="ngForm" class="space-y-6">
            <section class="glass-panel rounded-[32px] p-6 sm:p-8">
              <p class="eyebrow">Contact</p>
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  type="email"
                  name="email"
                  [(ngModel)]="orderForm.email"
                  required
                  placeholder="Email"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                />
                <input
                  type="tel"
                  name="phone"
                  [(ngModel)]="orderForm.phone"
                  placeholder="Phone"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                />
              </div>
            </section>

            <section class="glass-panel rounded-[32px] p-6 sm:p-8">
              <p class="eyebrow">Shipping</p>
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="fullName"
                  [(ngModel)]="orderForm.shippingAddress.fullName"
                  required
                  placeholder="Full name"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none md:col-span-2"
                />
                <input
                  type="text"
                  name="address"
                  [(ngModel)]="orderForm.shippingAddress.address"
                  required
                  placeholder="Street address"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none md:col-span-2"
                />
                <input
                  type="text"
                  name="city"
                  [(ngModel)]="orderForm.shippingAddress.city"
                  required
                  placeholder="City"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                />
                <input
                  type="text"
                  name="zipCode"
                  [(ngModel)]="orderForm.shippingAddress.zipCode"
                  required
                  placeholder="ZIP code"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                />
                <input
                  type="text"
                  name="country"
                  [(ngModel)]="orderForm.shippingAddress.country"
                  required
                  placeholder="Country"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none md:col-span-2"
                />
              </div>
            </section>

            <section class="glass-panel rounded-[32px] p-6 sm:p-8">
              <p class="eyebrow">Payment</p>
              <div class="mt-5 grid gap-3">
                @for (method of paymentMethods; track method.value) {
                  <label class="flex cursor-pointer items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                    <input type="radio" name="paymentMethod" [value]="method.value" [(ngModel)]="orderForm.paymentMethod" />
                    <div>
                      <p class="font-bold text-slate-950">{{ method.label }}</p>
                      <p class="text-sm text-slate-500">{{ method.description }}</p>
                    </div>
                  </label>
                }
              </div>
            </section>

            <button
              type="submit"
              [disabled]="checkoutForm.invalid"
              class="w-full rounded-full bg-slate-950 px-6 py-4 text-base font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
            >
              Place order for \${{ grandTotal | number: '1.2-2' }}
            </button>
          </form>

          <aside class="glass-panel rounded-[32px] p-6 sm:p-8">
            <p class="eyebrow">Order recap</p>
            <div class="mt-5 space-y-4">
              @for (item of cartItems; track item.product.id) {
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-slate-950">{{ item.product.name }}</p>
                    <p class="text-sm text-slate-500">{{ item.quantity }} x {{ item.product.price | currency: 'USD' }}</p>
                  </div>
                  <span class="text-sm font-bold text-slate-950">
                    {{ item.product.price * item.quantity | currency: 'USD' }}
                  </span>
                </div>
              }
            </div>

            <div class="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span class="font-bold text-slate-950">\${{ cartTotal | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Shipping</span>
                <span class="font-bold text-slate-950">\${{ shippingCost | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Tax</span>
                <span class="font-bold text-slate-950">\${{ taxAmount | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-emerald-700">
                <span>Savings</span>
                <span class="font-bold">-\${{ savings | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-200 pt-4 text-lg">
                <span class="font-semibold text-slate-700">Total</span>
                <span class="font-bold text-slate-950">\${{ grandTotal | number: '1.2-2' }}</span>
              </div>
            </div>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [],
})
export class CheckoutComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  readonly paymentMethods = [
    { value: 'card', label: 'Credit / Debit card', description: 'Fastest checkout for one-time purchases.' },
    { value: 'paypal', label: 'PayPal', description: 'Use your PayPal balance or linked account.' },
    { value: 'cash-on-delivery', label: 'Cash on delivery', description: 'Pay when the package arrives.' },
  ];

  cartItems: CartItem[] = [];
  cartTotal = 0;
  shippingCost = 0;
  taxAmount = 0;
  grandTotal = 0;
  savings = 0;

  orderForm = {
    email: '',
    phone: '',
    shippingAddress: {
      fullName: '',
      address: '',
      city: '',
      zipCode: '',
      country: '',
    },
    paymentMethod: 'card',
  };

  ngOnInit(): void {
    const user = this.storeService.getCurrentUser();
    if (user) {
      this.orderForm.email = user.email;
      this.orderForm.shippingAddress.fullName = user.name;
    }

    this.cartItems = this.storeService.getCart();
    const summary = this.storeService.getCartSummary();
    this.cartTotal = summary.subtotal;
    this.shippingCost = summary.shipping;
    this.taxAmount = summary.tax;
    this.grandTotal = summary.total;
    this.savings = this.storeService.getCartSavings();
  }

  placeOrder(): void {
    const order = this.storeService.placeOrder({
      shippingAddress: this.orderForm.shippingAddress,
      email: this.orderForm.email,
      phone: this.orderForm.phone,
      paymentMethod: this.orderForm.paymentMethod,
    });
    this.apiService
      .notifyOrder(order)
      .pipe(catchError(() => of(null)))
      .subscribe((notification) => {
        if (notification && !notification.sent) {
          console.warn(notification.message);
        }
        void this.router.navigate(['/orders']);
      });
  }
}
