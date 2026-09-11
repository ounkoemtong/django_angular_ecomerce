import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Order } from '../../models/ecommerce.model';
import { StoreService } from '../../services/store.service';

interface TrackingStep {
  label: string;
  detail: string;
  date: Date;
  complete: boolean;
  active: boolean;
}

interface OrderViewModel {
  order: Order;
  status: string;
  statusTone: string;
  nextStep: string;
  deliveryDate: Date;
  itemCount: number;
  trackingSteps: TrackingStep[];
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="section-shell py-8 sm:py-10">
      <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p class="eyebrow">Your orders</p>
          <h1 class="mt-2 text-4xl font-bold text-slate-950 sm:text-5xl">Follow your products from cart to door.</h1>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Track active purchases, review delivery progress, and keep your full buying history in one place.
          </p>
        </div>
        <a
          routerLink="/products"
          class="inline-flex rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Keep shopping
        </a>
      </div>

      @if (!isLoggedIn) {
        <div class="glass-panel mt-8 rounded-[32px] p-10 text-center">
          <p class="eyebrow">Private area</p>
          <h2 class="mt-3 text-3xl font-bold text-slate-950">Login to see your orders.</h2>
          <p class="mt-3 text-sm text-slate-500">Your order tracking and history are connected to your account.</p>
          <a routerLink="/login" class="mt-6 inline-flex rounded-md bg-slate-950 px-6 py-3 font-bold text-white">
            Login
          </a>
        </div>
      } @else if (orderViews.length === 0) {
        <div class="glass-panel mt-8 rounded-[32px] p-10 text-center">
          <p class="eyebrow">No history yet</p>
          <h2 class="mt-3 text-3xl font-bold text-slate-950">You have not placed an order.</h2>
          <p class="mt-3 text-sm text-slate-500">Buy something from the catalog and your tracking card will appear here.</p>
          <a routerLink="/products" class="mt-6 inline-flex rounded-md bg-slate-950 px-6 py-3 font-bold text-white">
            Browse products
          </a>
        </div>
      } @else {
        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="metric-card rounded-lg">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Orders</p>
            <p class="mt-2 text-3xl font-bold text-slate-950">{{ orderViews.length }}</p>
          </div>
          <div class="metric-card rounded-lg">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Total spent</p>
            <p class="mt-2 text-3xl font-bold text-slate-950">{{ lifetimeSpend | currency: 'USD' }}</p>
          </div>
          <div class="metric-card rounded-lg">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Average order</p>
            <p class="mt-2 text-3xl font-bold text-slate-950">{{ averageOrderValue | currency: 'USD' }}</p>
          </div>
        </div>

        <section class="mt-10">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="eyebrow">Active tracking</p>
              <h2 class="mt-2 text-3xl font-bold text-slate-950">Where your products are now</h2>
            </div>
            <p class="text-sm font-semibold text-slate-500">Tracking is estimated from your checkout time.</p>
          </div>

          <div class="mt-6 grid gap-6">
            @for (view of orderViews; track view.order.id) {
              <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
                <div class="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
                  <div>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                          Order #{{ view.order.id }}
                        </p>
                        <h3 class="mt-2 text-2xl font-bold text-slate-950">{{ view.status }}</h3>
                      </div>
                      <span class="rounded-full px-3 py-1 text-sm font-bold" [ngClass]="view.statusTone">
                        {{ view.nextStep }}
                      </span>
                    </div>

                    <div class="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500">Placed</span>
                        <span class="font-bold text-slate-950">{{ view.order.date | date: 'MMM dd, yyyy h:mm a' }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500">Estimated delivery</span>
                        <span class="font-bold text-slate-950">{{ view.deliveryDate | date: 'MMM dd, yyyy' }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500">Items</span>
                        <span class="font-bold text-slate-950">{{ view.itemCount }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-slate-500">Total</span>
                        <span class="font-bold text-slate-950">{{ view.order.pricing.total | currency: 'USD' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-4">
                    @for (step of view.trackingSteps; track step.label) {
                      <div
                        class="rounded-lg border p-4"
                        [ngClass]="
                          step.complete
                            ? 'border-emerald-200 bg-emerald-50'
                            : step.active
                              ? 'border-amber-200 bg-amber-50'
                              : 'border-slate-200 bg-slate-50'
                        "
                      >
                        <div
                          class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                          [ngClass]="
                            step.complete
                              ? 'bg-emerald-600 text-white'
                              : step.active
                                ? 'bg-amber-300 text-slate-950'
                                : 'bg-slate-200 text-slate-500'
                          "
                        >
                          {{ step.complete ? '✓' : step.active ? '•' : '-' }}
                        </div>
                        <p class="mt-3 font-bold text-slate-950">{{ step.label }}</p>
                        <p class="mt-1 text-xs leading-5 text-slate-500">{{ step.detail }}</p>
                        <p class="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          {{ step.date | date: 'MMM dd' }}
                        </p>
                      </div>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        </section>

        <section class="mt-10 pb-8">
          <p class="eyebrow">Order history</p>
          <h2 class="mt-2 text-3xl font-bold text-slate-950">Everything you bought</h2>

          <div class="mt-6 space-y-4">
            @for (view of orderViews; track view.order.id) {
              <details class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" [open]="$first">
                <summary class="cursor-pointer list-none">
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                        Order #{{ view.order.id }}
                      </p>
                      <p class="mt-2 text-lg font-bold text-slate-950">
                        {{ view.order.date | date: 'MMMM dd, yyyy' }}
                      </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                      <span class="rounded-full px-3 py-1 text-sm font-bold" [ngClass]="view.statusTone">
                        {{ view.status }}
                      </span>
                      <span class="text-lg font-bold text-slate-950">
                        {{ view.order.pricing.total | currency: 'USD' }}
                      </span>
                    </div>
                  </div>
                </summary>

                <div class="mt-5 grid gap-6 border-t border-slate-200 pt-5 lg:grid-cols-[1fr_0.75fr]">
                  <div class="space-y-4">
                    @for (item of view.order.items; track item.product.id) {
                      <div class="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img
                          [src]="item.product.imageUrl"
                          [alt]="item.product.name"
                          class="h-16 w-16 rounded-md object-cover"
                        />
                        <div class="min-w-0 flex-1">
                          <p class="truncate font-bold text-slate-950">{{ item.product.name }}</p>
                          <p class="text-sm text-slate-500">
                            {{ item.quantity }} x {{ item.product.price | currency: 'USD' }}
                          </p>
                        </div>
                        <span class="text-sm font-bold text-slate-950">
                          {{ item.product.price * item.quantity | currency: 'USD' }}
                        </span>
                      </div>
                    }
                  </div>

                  <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p class="font-bold text-slate-950">Delivery details</p>
                    <p class="mt-3 text-slate-600">
                      {{ view.order.shippingAddress.fullName }}<br />
                      {{ view.order.shippingAddress.address }}<br />
                      {{ view.order.shippingAddress.city }}, {{ view.order.shippingAddress.zipCode }}<br />
                      {{ view.order.shippingAddress.country }}
                    </p>
                    <div class="mt-4 space-y-2 border-t border-slate-200 pt-4">
                      <div class="flex justify-between">
                        <span class="text-slate-500">Payment</span>
                        <span class="font-bold text-slate-950">{{ view.order.paymentMethod }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Subtotal</span>
                        <span class="font-bold text-slate-950">{{ view.order.pricing.subtotal | currency: 'USD' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Shipping</span>
                        <span class="font-bold text-slate-950">{{ view.order.pricing.shipping | currency: 'USD' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Tax</span>
                        <span class="font-bold text-slate-950">{{ view.order.pricing.tax | currency: 'USD' }}</span>
                      </div>
                      <div class="flex justify-between border-t border-slate-200 pt-3 text-base">
                        <span class="font-bold text-slate-950">Total</span>
                        <span class="font-bold text-slate-950">{{ view.order.pricing.total | currency: 'USD' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: [],
})
export class OrdersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly storeService = inject(StoreService);

  orderViews: OrderViewModel[] = [];
  isLoggedIn = false;
  lifetimeSpend = 0;
  averageOrderValue = 0;

  ngOnInit(): void {
    this.refresh();

    this.storeService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refresh();
    });

    this.storeService.orders$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refresh();
    });
  }

  private refresh(): void {
    this.isLoggedIn = this.storeService.isLoggedIn();
    const orders = this.isLoggedIn ? this.storeService.getOrders() : [];
    this.orderViews = orders.map((order) => this.toOrderView(order));
    this.lifetimeSpend = this.isLoggedIn ? this.storeService.getLifetimeSpend() : 0;
    this.averageOrderValue = this.isLoggedIn ? this.storeService.getAverageOrderValue() : 0;
  }

  private toOrderView(order: Order): OrderViewModel {
    const placedAt = new Date(order.date);
    const oneDay = 24 * 60 * 60 * 1000;
    const ageInDays = Math.max(0, Math.floor((Date.now() - placedAt.getTime()) / oneDay));
    const activeIndex = Math.min(ageInDays, 3);
    const steps = [
      { label: 'Confirmed', detail: 'Your order was received.', offset: 0 },
      { label: 'Packed', detail: 'The store is preparing your items.', offset: 1 },
      { label: 'Shipped', detail: 'Your package is moving.', offset: 2 },
      { label: 'Delivered', detail: 'The order should be at your address.', offset: 4 },
    ];
    const statuses = ['Confirmed', 'Packing order', 'On the way', 'Delivered'];
    const tones = [
      'bg-amber-100 text-amber-800',
      'bg-sky-100 text-sky-800',
      'bg-indigo-100 text-indigo-800',
      'bg-emerald-100 text-emerald-800',
    ];

    return {
      order,
      status: statuses[activeIndex],
      statusTone: tones[activeIndex],
      nextStep: activeIndex === 3 ? 'Complete' : `Next: ${steps[activeIndex + 1].label}`,
      deliveryDate: this.addDays(placedAt, 4),
      itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
      trackingSteps: steps.map((step, index) => ({
        label: step.label,
        detail: step.detail,
        date: this.addDays(placedAt, step.offset),
        complete: index < activeIndex || activeIndex === 3,
        active: index === activeIndex && activeIndex !== 3,
      })),
    };
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }
}
