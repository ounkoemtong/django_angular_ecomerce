import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../models/ecommerce.model';
import { ProductService } from '../../services/product.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (product; as selectedProduct) {
      <section class="section-shell py-8 sm:py-10">
        <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div class="gradient-border overflow-hidden rounded-[36px] bg-white">
            <div class="relative h-full min-h-[24rem] bg-gradient-to-br" [ngClass]="selectedProduct.accent">
              <img
                [src]="selectedProduct.imageUrl"
                [alt]="selectedProduct.name"
                class="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
              />
            </div>
          </div>

          <div class="glass-panel rounded-[36px] p-6 sm:p-8">
            <p class="eyebrow">{{ selectedProduct.brand }} / {{ selectedProduct.category }}</p>
            <div class="mt-4 flex flex-wrap items-center gap-3">
              @if (selectedProduct.badge) {
                <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  {{ selectedProduct.badge }}
                </span>
              }
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {{ selectedProduct.rating }} stars
              </span>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {{ selectedProduct.reviews }} reviews
              </span>
            </div>

            <h1 class="mt-4 text-4xl font-bold text-slate-950">{{ selectedProduct.name }}</h1>
            <p class="mt-4 text-base leading-7 text-slate-600">{{ selectedProduct.description }}</p>

            <div class="mt-6 flex items-end gap-3">
              <p class="text-4xl font-bold text-slate-950">\${{ selectedProduct.price | number: '1.2-2' }}</p>
              @if (selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price) {
                <p class="pb-1 text-lg text-slate-400 line-through">
                  \${{ selectedProduct.originalPrice | number: '1.2-2' }}
                </p>
              }
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="metric-card p-4">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Stock</p>
                <p class="mt-2 text-2xl font-bold text-slate-950">{{ selectedProduct.stock }}</p>
              </div>
              <div class="metric-card p-4">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Shipping</p>
                <p class="mt-2 text-lg font-bold text-slate-950">Free over $50</p>
              </div>
              <div class="metric-card p-4">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Returns</p>
                <p class="mt-2 text-lg font-bold text-slate-950">30 days</p>
              </div>
            </div>

            <div class="mt-6">
              <p class="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Highlights</p>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (feature of selectedProduct.features; track feature) {
                  <span class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    {{ feature }}
                  </span>
                }
              </div>
            </div>

            <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <button
                  type="button"
                  (click)="decrementQuantity()"
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700"
                >
                  -
                </button>
                <input
                  type="number"
                  [(ngModel)]="quantity"
                  (ngModelChange)="quantity = sanitizeQuantity($event)"
                  min="1"
                  [max]="selectedProduct.stock"
                  class="w-16 bg-transparent text-center text-lg font-bold text-slate-950 outline-none"
                />
                <button
                  type="button"
                  (click)="incrementQuantity()"
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                (click)="addToCart()"
                [disabled]="selectedProduct.stock === 0"
                class="rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
              >
                Add {{ quantity }} to cart
              </button>
              <button
                type="button"
                (click)="buyNow()"
                [disabled]="selectedProduct.stock === 0"
                class="rounded-full bg-amber-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-200 disabled:bg-amber-100"
              >
                Buy now
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="section-shell pb-12">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Related picks</p>
            <h2 class="mt-2 text-3xl font-bold text-slate-950">Keep the same setup energy.</h2>
          </div>
          <a routerLink="/products" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
            Return to catalog
          </a>
        </div>

        <div class="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          @for (related of relatedProducts; track related.id) {
            <a
              [routerLink]="'/products/' + related.id"
              class="glass-panel block rounded-[28px] p-4 transition hover:-translate-y-1"
            >
              <div class="h-48 rounded-[22px] bg-gradient-to-br" [ngClass]="related.accent"></div>
              <p class="mt-4 text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
                {{ related.brand }}
              </p>
              <h3 class="mt-2 text-lg font-bold text-slate-950">{{ related.name }}</h3>
              <p class="mt-2 text-sm font-semibold text-slate-700">
                {{ related.price | currency: 'USD' }}
              </p>
            </a>
          }
        </div>
      </section>
    } @else {
      <section class="section-shell py-20 text-center">
        <div class="glass-panel rounded-[32px] p-10">
          <h1 class="text-4xl font-bold text-slate-950">Product not found</h1>
          <p class="mt-3 text-sm text-slate-500">The item may have been removed from the catalog.</p>
          <a
            routerLink="/products"
            class="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 font-bold text-white"
          >
            Back to products
          </a>
        </div>
      </section>
    }
  `,
  styles: [],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly storeService = inject(StoreService);

  product: Product | null = null;
  relatedProducts: Product[] = [];
  quantity = 1;

  ngOnInit(): void {
    this.productService.loadProducts().subscribe(() => this.syncProduct());
    this.route.paramMap.subscribe((params) => {
      this.syncProduct(Number.parseInt(params.get('id') ?? '0', 10));
    });
  }

  syncProduct(routeId?: number): void {
    const id = routeId ?? Number.parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    this.product = this.productService.getProductById(id) ?? null;
    this.relatedProducts = this.product ? this.productService.getRelatedProducts(this.product.id) : [];
    this.quantity = 1;
  }

  sanitizeQuantity(value: number): number {
    if (!this.product) {
      return 1;
    }
    return Math.min(Math.max(1, Number(value) || 1), this.product.stock);
  }

  incrementQuantity(): void {
    if (this.product) {
      this.quantity = Math.min(this.quantity + 1, this.product.stock);
    }
  }

  decrementQuantity(): void {
    this.quantity = Math.max(this.quantity - 1, 1);
  }

  addToCart(): void {
    if (this.product && this.product.stock > 0) {
      this.storeService.addToCart(this.product, this.quantity);
    }
  }

  buyNow(): void {
    this.addToCart();
    void this.router.navigate(['/checkout']);
  }
}
