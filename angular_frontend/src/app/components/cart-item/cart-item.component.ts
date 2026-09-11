import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CartItem } from '../../models/ecommerce.model';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="glass-panel rounded-[28px] p-4 sm:p-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="relative h-28 overflow-hidden rounded-[24px] bg-gradient-to-br sm:w-32" [ngClass]="item.product.accent">
          <img [src]="item.product.imageUrl" [alt]="item.product.name" class="h-full w-full object-cover mix-blend-multiply" />
        </div>

        <div class="flex-1">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            {{ item.product.brand }} / {{ item.product.category }}
          </p>
          <h4 class="mt-2 text-lg font-bold text-slate-950">{{ item.product.name }}</h4>
          <p class="mt-1 text-sm text-slate-500">
            {{ item.product.features[0] }} • {{ item.product.stock }} available
          </p>
          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              (click)="decrementQuantity.emit()"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700"
            >
              -
            </button>
            <span class="w-10 text-center text-sm font-bold text-slate-950">{{ item.quantity }}</span>
            <button
              type="button"
              (click)="incrementQuantity.emit()"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700"
            >
              +
            </button>
          </div>
        </div>

        <div class="sm:text-right">
          <p class="text-sm text-slate-500">Line total</p>
          <p class="mt-1 text-xl font-bold text-slate-950">
            \${{ item.product.price * item.quantity | number: '1.2-2' }}
          </p>
          <button
            type="button"
            (click)="remove.emit()"
            class="mt-3 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [],
})
export class CartItemComponent {
  @Input() item!: CartItem;

  @Output() incrementQuantity = new EventEmitter<void>();
  @Output() decrementQuantity = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
}
