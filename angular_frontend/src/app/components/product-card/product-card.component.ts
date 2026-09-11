import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/ecommerce.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article
      class="gradient-border overflow-hidden rounded-[28px] bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_rgba(15,23,42,0.12)]"
    >
      <div class="relative overflow-hidden">
        <div class="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
          @if (product.badge) {
            <span class="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900">
              {{ product.badge }}
            </span>
          }
          <span class="rounded-full bg-slate-950/85 px-3 py-1 text-xs font-bold text-white">
            {{ product.rating }} / 5
          </span>
        </div>

        <div class="h-60 bg-gradient-to-br" [ngClass]="product.accent"></div>
        <img
          [src]="product.imageUrl"
          [alt]="product.name"
          class="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
        />
      </div>

      <div class="p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {{ product.brand }} / {{ product.category }}
            </p>
            <h3 class="mt-2 text-xl font-bold text-slate-950">{{ product.name }}</h3>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold text-slate-950">\${{ product.price | number: '1.2-2' }}</p>
            @if (product.originalPrice && product.originalPrice > product.price) {
              <p class="text-sm text-slate-400 line-through">
                \${{ product.originalPrice | number: '1.2-2' }}
              </p>
            }
          </div>
        </div>

        <p class="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{{ product.description }}</p>

        <div class="mt-4 flex flex-wrap gap-2">
          @for (feature of product.features.slice(0, 2); track feature) {
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {{ feature }}
            </span>
          }
        </div>

        <div class="mt-5 flex items-center justify-between text-sm text-slate-500">
          <span>{{ product.reviews }} reviews</span>
          <span>{{ product.stock }} units ready</span>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-2">
          <a
            [routerLink]="'/products/' + product.id"
            class="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Explore
          </a>
          <button
            type="button"
            (click)="addToCart.emit(product)"
            [disabled]="product.stock === 0"
            class="rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
          >
            {{ product.stock === 0 ? 'Sold out' : 'Add to cart' }}
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [],
})
export class ProductCardComponent {
  @Input() product!: Product;

  @Output() addToCart = new EventEmitter<Product>();
}
