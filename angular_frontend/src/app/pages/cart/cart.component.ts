import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartItem } from '../../models/ecommerce.model';
import { CartItemComponent } from '../../components/cart-item/cart-item.component';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, CartItemComponent],
  template: `
    <section class="section-shell py-8 sm:py-10">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Cart review</p>
          <h1 class="mt-2 text-4xl font-bold text-slate-950">Your current build.</h1>
        </div>
        <a routerLink="/products" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
          Continue shopping
        </a>
      </div>

      @if (cartItems.length === 0) {
        <div class="glass-panel mt-8 rounded-[36px] p-10 text-center">
          <h2 class="text-3xl font-bold text-slate-950">Your cart is empty.</h2>
          <p class="mt-3 text-sm text-slate-500">Add a few products and the full checkout summary will appear here.</p>
          <a
            routerLink="/products"
            class="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 font-bold text-white"
          >
            Explore products
          </a>
        </div>
      } @else {
        <div class="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-4">
            @for (item of cartItems; track item.product.id) {
              <app-cart-item
                [item]="item"
                (incrementQuantity)="updateQuantity(item.product.id, item.quantity + 1)"
                (decrementQuantity)="updateQuantity(item.product.id, item.quantity - 1)"
                (remove)="removeItem(item.product.id)"
              ></app-cart-item>
            }
          </div>

          <aside class="glass-panel rounded-[32px] p-6 sm:p-8">
            <p class="eyebrow">Summary</p>
            <h2 class="mt-2 text-2xl font-bold text-slate-950">Checkout preview</h2>

            <div class="mt-6 space-y-4 text-sm text-slate-600">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span class="font-bold text-slate-950">\${{ cartTotal | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Shipping</span>
                <span class="font-bold text-slate-950">\${{ shippingCost | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Estimated tax</span>
                <span class="font-bold text-slate-950">\${{ taxAmount | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-emerald-700">
                <span>Discount captured</span>
                <span class="font-bold">-\${{ savings | number: '1.2-2' }}</span>
              </div>
              <div class="border-t border-slate-200 pt-4">
                <div class="flex justify-between text-lg">
                  <span class="font-semibold text-slate-700">Total</span>
                  <span class="font-bold text-slate-950">\${{ grandTotal | number: '1.2-2' }}</span>
                </div>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <button
                type="button"
                (click)="proceedToCheckout()"
                class="w-full rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
              >
                Proceed to checkout
              </button>
              <button
                type="button"
                (click)="clearCart()"
                class="w-full rounded-full border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Clear cart
              </button>
            </div>

            <div class="mt-6 rounded-[24px] bg-amber-50 p-4 text-sm text-amber-950">
              Orders above $50 ship free. Add or keep enough items to avoid the shipping fee.
            </div>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [],
})
export class CartComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly router = inject(Router);

  cartItems: CartItem[] = [];
  cartTotal = 0;
  shippingCost = 0;
  taxAmount = 0;
  grandTotal = 0;
  savings = 0;

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartItems = this.storeService.getCart();
    const summary = this.storeService.getCartSummary();
    this.cartTotal = summary.subtotal;
    this.shippingCost = summary.shipping;
    this.taxAmount = summary.tax;
    this.grandTotal = summary.total;
    this.savings = this.storeService.getCartSavings();
  }

  updateQuantity(productId: number, quantity: number): void {
    this.storeService.updateQuantity(productId, quantity);
    this.loadCart();
  }

  removeItem(productId: number): void {
    this.storeService.removeFromCart(productId);
    this.loadCart();
  }

  proceedToCheckout(): void {
    void this.router.navigate(['/checkout']);
  }

  clearCart(): void {
    this.storeService.clearCart();
    this.loadCart();
  }
}
