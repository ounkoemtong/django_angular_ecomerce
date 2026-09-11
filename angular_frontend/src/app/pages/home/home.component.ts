import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/ecommerce.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { StoreService } from '../../services/store.service';

interface CategoryLoop {
  name: string;
  products: Product[];
  loopedProducts: Product[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <section class="section-shell py-8 sm:py-10">
      <div class="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div class="gradient-border overflow-hidden rounded-[36px] bg-slate-950 p-4 text-white sm:p-6">
          <div>
            @if (motionProducts.length > 0) {
              <div class="motion-panel hero-feature-panel">
                <div class="flex flex-wrap items-center justify-between gap-3 px-2 pb-4">
                  <div>
                    <p class="motion-label p-0 text-amber-200">Slide right</p>
                    <h2 class="mt-2 text-2xl font-bold text-white">Products moving now</h2>
                  </div>
                  <a
                    routerLink="/products"
                    class="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    View all
                  </a>
                </div>

                <div class="motion-window hero-feature-window">
                  <div class="hero-rail hero-rail-right">
                    @for (product of motionProducts; track product.id + '-hero-right-' + $index) {
                      <article class="hero-motion-card">
                        <img [src]="product.imageUrl" [alt]="product.name" class="hero-motion-image" />
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-base font-bold text-white">{{ product.name }}</p>
                          <p class="mt-1 text-sm font-semibold text-amber-200">
                            {{ product.brand }} / {{ product.category }}
                          </p>
                          <p class="mt-1 line-clamp-2 text-sm leading-5 text-slate-300">{{ product.description }}</p>
                          <div class="mt-3 flex flex-wrap items-center gap-2">
                            <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                              {{ product.price | currency: 'USD' }}
                            </span>
                            <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-200">
                              {{ product.stock }} in stock
                            </span>
                            <a
                              [routerLink]="'/products/' + product.id"
                              class="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950 transition hover:bg-amber-200"
                            >
                              Detail
                            </a>
                          </div>
                        </div>
                      </article>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="grid gap-4">
          <div class="category-motion-card">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="eyebrow text-slate-300">Category slider</p>
                <h2 class="mt-2 text-2xl font-bold text-white">{{ activeCategoryName }}</h2>
              </div>
              <p class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-200">
                {{ activeCategoryProducts.length }} items
              </p>
            </div>

            @if (activeCategoryProducts.length > 0) {
              <div class="category-motion-panel mt-4">
                <p class="category-motion-label text-amber-200">Slide right</p>
                <div class="category-motion-window category-motion-window-horizontal">
                  <div class="category-rail category-rail-right">
                    @for (product of categoryMotionProducts; track product.id + '-category-right-' + $index) {
                      <a [routerLink]="'/products/' + product.id" class="category-product-card">
                        <img [src]="product.imageUrl" [alt]="product.name" class="category-product-image" />
                        <div class="min-w-0">
                          <p class="truncate text-sm font-bold text-white">{{ product.name }}</p>
                          <p class="text-xs font-semibold text-amber-200">{{ product.category }}</p>
                          <p class="text-xs text-slate-300">{{ product.brand }} / {{ product.price | currency: 'USD' }}</p>
                        </div>
                      </a>
                    }
                  </div>
                </div>
              </div>
            } @else {
              <p class="mt-4 text-sm text-slate-300">No products found for this category yet.</p>
            }
          </div>

          <div
            class="overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.22)]"
          >
            <div class="flex items-center justify-between gap-3 px-5 pt-5">
              <div>
                <p class="eyebrow text-cyan-200">Category showcase</p>
                <h2 class="mt-2 text-2xl font-bold">{{ activeCategoryName }} moving now.</h2>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="previousCategory()"
                  class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Previous category"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  (click)="nextCategory()"
                  class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Next category"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>

            @if (activeCategoryProducts.length > 0) {
              <div class="relative mt-5">
                <div
                  class="flex transition-transform duration-700 ease-out"
                  [style.transform]="'translateX(-' + activeHeroSlide * 100 + '%)'"
                >
                  @for (product of activeCategoryProducts; track product.id) {
                    <article class="min-w-full px-5 pb-5">
                      <a [routerLink]="'/products/' + product.id" class="block">
                        <div class="relative h-52 overflow-hidden rounded-[22px] bg-gradient-to-br" [ngClass]="product.accent">
                          <img
                            [src]="product.imageUrl"
                            [alt]="product.name"
                            class="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
                          />
                          @if (product.badge) {
                            <span class="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-950">
                              {{ product.badge }}
                            </span>
                          }
                        </div>
                        <div class="mt-4 flex items-start justify-between gap-4">
                          <div class="min-w-0">
                            <p class="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                              {{ product.brand }} / {{ product.category }}
                            </p>
                            <h3 class="mt-2 truncate text-xl font-bold text-white">{{ product.name }}</h3>
                          </div>
                          <p class="shrink-0 text-xl font-bold text-amber-200">{{ product.price | currency: 'USD' }}</p>
                        </div>
                        <p class="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{{ product.description }}</p>
                      </a>
                      <button
                        type="button"
                        (click)="onAddToCart(product)"
                        [disabled]="product.stock === 0"
                        class="mt-4 w-full rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:bg-slate-600 disabled:text-slate-300"
                      >
                        {{ product.stock === 0 ? 'Sold out' : 'Add to cart' }}
                      </button>
                    </article>
                  }
                </div>
              </div>

              <div class="flex items-center justify-center gap-2 px-5 pb-5">
                @for (product of activeCategoryProducts; track product.id; let index = $index) {
                  <button
                    type="button"
                    (click)="goToSlide(index)"
                    class="h-2.5 rounded-full transition-all"
                    [class]="activeHeroSlide === index ? 'w-8 bg-amber-300' : 'w-2.5 bg-white/30'"
                    [attr.aria-label]="'Show ' + activeCategoryName + ' product ' + (index + 1)"
                  ></button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    <section class="section-shell py-8">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Featured now</p>
          <h2 class="mt-2 text-3xl font-bold text-slate-950">High-performing picks</h2>
        </div>
        <a routerLink="/products" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
          View all products
        </a>
      </div>

      <div class="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        @for (product of featuredProducts; track product.id) {
          <app-product-card [product]="product" (addToCart)="onAddToCart($event)"></app-product-card>
        }
      </div>
    </section>

    <section class="section-shell py-8">
      <div class="glass-panel rounded-[32px] p-6 sm:p-8">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Category loops</p>
            <h2 class="mt-2 text-3xl font-bold text-slate-950">Real backend products, grouped by category.</h2>
          </div>
          <a routerLink="/products" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
            View full catalog
          </a>
        </div>

        @if (categoryLoops.length === 0) {
          <div class="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
            No backend products are available yet.
          </div>
        } @else {
          <div class="mt-6 grid gap-6">
            @for (loop of categoryLoops; track loop.name) {
              <section class="overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Category</p>
                    <h3 class="mt-2 text-2xl font-bold">{{ loop.name }}</h3>
                  </div>
                  <a
                    routerLink="/products"
                    [queryParams]="{ category: loop.name }"
                    class="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    View category
                  </a>
                </div>

                <div class="category-motion-panel mt-5">
                  <p class="category-motion-label text-amber-200">{{ loop.products.length }} products</p>
                  <div class="category-motion-window category-motion-window-horizontal">
                    <div class="category-rail category-rail-right">
                      @for (product of loop.loopedProducts; track product.id + '-loop-' + $index) {
                        <a [routerLink]="'/products/' + product.id" class="category-product-card">
                          <img [src]="product.imageUrl" [alt]="product.name" class="category-product-image" />
                          <div class="min-w-0">
                            <p class="truncate text-sm font-bold text-white">{{ product.name }}</p>
                            <p class="text-xs font-semibold text-amber-200">{{ product.brand }}</p>
                            <p class="text-xs text-slate-300">{{ product.price | currency: 'USD' }}</p>
                          </div>
                        </a>
                      }
                    </div>
                  </div>
                </div>
              </section>
            }
          </div>
        }
        </div>
    </section>
  `,
  styles: [
    `
      .hero-rail {
        display: flex;
        width: max-content;
        gap: 0.75rem;
      }

      .motion-panel {
        overflow: hidden;
        border-radius: 1.625rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.06);
        padding: 1rem;
      }

      .motion-label {
        padding: 0 0.5rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }

      .hero-feature-panel {
        min-height: 31rem;
        padding: 1.5rem;
      }

      .motion-window {
        overflow: hidden;
      }

      .hero-feature-window {
        height: 22rem;
      }

      .hero-rail-right {
        animation: heroRailRight 24s linear infinite;
      }

      .hero-motion-card {
        display: flex;
        width: clamp(19rem, 34vw, 25rem);
        min-height: 19rem;
        align-items: center;
        gap: 1rem;
        border-radius: 1.75rem;
        background: rgba(255, 255, 255, 0.1);
        padding: 1.25rem;
        transition: background 160ms ease;
      }

      .hero-motion-image {
        height: 8rem;
        width: 8rem;
        flex-shrink: 0;
        border-radius: 1.5rem;
        object-fit: cover;
      }

      .hero-motion-card:hover {
        background: rgba(255, 255, 255, 0.16);
      }

      .category-motion-card {
        overflow: hidden;
        border-radius: 1.75rem;
        background: #020617;
        padding: 1.25rem;
        color: white;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
      }

      .category-motion-panel {
        overflow: hidden;
        border-radius: 1.25rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.07);
        padding: 0.75rem;
      }

      .category-motion-label {
        padding: 0 0.25rem 0.5rem;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      .category-motion-window {
        overflow: hidden;
      }

      .category-motion-window-horizontal {
        height: 6rem;
      }

      .category-motion-window-vertical {
        height: 11.5rem;
      }

      .category-rail {
        display: flex;
        width: max-content;
        gap: 0.75rem;
      }

      .category-rail-right {
        animation: heroRailRight 18s linear infinite;
      }

      .category-product-card {
        display: flex;
        width: 16.5rem;
        min-height: 5rem;
        align-items: center;
        gap: 0.75rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.1);
        padding: 0.75rem;
        transition:
          background 160ms ease,
          transform 160ms ease;
      }

      .category-product-card:hover {
        background: rgba(255, 255, 255, 0.16);
        transform: translateY(-1px);
      }

      .category-product-image {
        height: 3.5rem;
        width: 3.5rem;
        flex-shrink: 0;
        border-radius: 0.9rem;
        object-fit: cover;
      }

      @keyframes heroRailRight {
        from {
          transform: translateX(-50%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes heroRailLeft {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-rail-right,
        .category-rail-right {
          animation: none;
        }
      }

      @media (max-width: 640px) {
        .hero-motion-card {
          width: 18rem;
          min-height: 24rem;
          align-items: flex-start;
          flex-direction: column;
        }

        .hero-motion-image {
          height: 10rem;
          width: 100%;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly storeService = inject(StoreService);

  featuredProducts: Product[] = [];
  newArrivals: Product[] = [];
  motionProducts: Product[] = [];
  categories: string[] = [];
  categoryLoops: CategoryLoop[] = [];
  activeCategoryProducts: Product[] = [];
  activeCategoryName = 'Products';
  categoryMotionProducts: Product[] = [];
  activeHeroSlide = 0;
  totalProducts = 0;
  inventoryUnits = 0;
  averagePrice = 0;
  private slideTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.refreshCatalog();
    this.productService.loadProducts().subscribe(() => this.refreshCatalog());
    this.startSlideTimer();
  }

  ngOnDestroy(): void {
    this.stopSlideTimer();
  }

  refreshCatalog(): void {
    this.featuredProducts = this.productService.getFeaturedProducts();
    this.newArrivals = this.productService.getNewArrivals();
    this.motionProducts = this.getLoopedProducts();
    this.categories = this.productService.getCategories();
    this.categoryLoops = this.categories
      .map((category) => {
        const products = this.productService.getProductsByCategory(category);
        return {
          name: category,
          products,
          loopedProducts: products.length > 1 ? [...products, ...products] : products,
        };
      })
      .filter((loop) => loop.products.length > 0);
    this.activeCategoryIndex = Math.min(this.activeCategoryIndex, Math.max(this.categories.length - 1, 0));
    this.setActiveCategory(this.activeCategoryIndex);

    const stats = this.productService.getCatalogStats();
    this.totalProducts = stats.totalProducts;
    this.inventoryUnits = stats.inventoryUnits;
    this.averagePrice = stats.averagePrice;
  }

  onAddToCart(product: Product): void {
    this.storeService.addToCart(product);
  }

  nextSlide(): void {
    if (this.activeCategoryProducts.length === 0) {
      return;
    }
    this.activeHeroSlide = (this.activeHeroSlide + 1) % this.activeCategoryProducts.length;
    this.restartSlideTimer();
  }

  previousSlide(): void {
    if (this.activeCategoryProducts.length === 0) {
      return;
    }
    this.activeHeroSlide =
      (this.activeHeroSlide - 1 + this.activeCategoryProducts.length) % this.activeCategoryProducts.length;
    this.restartSlideTimer();
  }

  goToSlide(index: number): void {
    this.activeHeroSlide = index;
    this.restartSlideTimer();
  }

  nextCategory(): void {
    if (this.categories.length === 0) {
      return;
    }

    this.setActiveCategory((this.activeCategoryIndex + 1) % this.categories.length);
    this.restartSlideTimer();
  }

  previousCategory(): void {
    if (this.categories.length === 0) {
      return;
    }

    this.setActiveCategory((this.activeCategoryIndex - 1 + this.categories.length) % this.categories.length);
    this.restartSlideTimer();
  }

  private getProductsLoopedByCategory(): Product[] {
    const products = [...this.activeCategoryProducts].sort((left, right) => left.name.localeCompare(right.name));

    return [...products, ...products];
  }

  private getLoopedProducts(): Product[] {
    const products = this.productService
      .getAllProducts()
      .sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name));

    return products.length > 1 ? [...products, ...products] : products;
  }

  private activeCategoryIndex = 0;

  private setActiveCategory(index: number): void {
    this.activeCategoryIndex = index;
    this.activeCategoryName = this.categories[index] ?? 'Products';
    this.activeCategoryProducts = this.activeCategoryName
      ? this.productService.getProductsByCategory(this.activeCategoryName)
      : [];
    this.categoryMotionProducts = this.getProductsLoopedByCategory();
    this.activeHeroSlide = 0;
  }

  private startSlideTimer(): void {
    this.stopSlideTimer();
    this.slideTimer = setInterval(() => {
      if (this.activeCategoryProducts.length > 1) {
        const nextProductIndex = (this.activeHeroSlide + 1) % this.activeCategoryProducts.length;
        this.activeHeroSlide = nextProductIndex;

        if (nextProductIndex === 0 && this.categories.length > 1) {
          this.setActiveCategory((this.activeCategoryIndex + 1) % this.categories.length);
        }
      } else if (this.categories.length > 1) {
        this.setActiveCategory((this.activeCategoryIndex + 1) % this.categories.length);
      }
    }, 3500);
  }

  private restartSlideTimer(): void {
    this.startSlideTimer();
  }

  private stopSlideTimer(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }
}
