import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../models/ecommerce.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <section class="section-shell py-8 sm:py-10">
      <div class="glass-panel rounded-[36px] p-6 sm:p-8">
        <p class="eyebrow">Full catalog</p>
        <div class="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 class="text-4xl font-bold text-slate-950">Browse by product, brand, or category.</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Search across a richer catalog, compare discounts, and sort by price or customer demand.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4 sm:flex">
            <div class="metric-card min-w-32 p-4">
              <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Results</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ filteredProducts.length }}</p>
            </div>
            <div class="metric-card min-w-32 p-4">
              <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Categories</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ categories.length }}</p>
            </div>
          </div>
        </div>

        <div class="mt-8 grid gap-4 xl:grid-cols-[1.5fr_0.9fr_0.8fr_auto]">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Search by name, description, or brand"
            class="rounded-full border border-slate-200 bg-white px-5 py-3 outline-none transition focus:border-slate-400"
            (input)="applyFilters(true)"
          />

          <select
            [(ngModel)]="selectedCategory"
            class="rounded-full border border-slate-200 bg-white px-5 py-3 outline-none"
            (change)="applyFilters(true)"
          >
            <option value="">All categories</option>
            @for (category of categories; track category) {
              <option [value]="category">{{ category }}</option>
            }
          </select>

          <select
            [(ngModel)]="sortBy"
            class="rounded-full border border-slate-200 bg-white px-5 py-3 outline-none"
            (change)="applyFilters(true)"
          >
            <option value="name">Name</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>

          <button
            type="button"
            (click)="clearFilters()"
            class="rounded-full border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          @for (category of categories; track category) {
            <button
              type="button"
              (click)="selectCategory(category)"
              [class]="selectedCategory === category ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition"
            >
              {{ category }}
            </button>
          }
        </div>
      </div>
    </section>

    <section class="section-shell pb-12">
      @if (filteredProducts.length === 0) {
        <div class="glass-panel rounded-[32px] p-10 text-center">
          <h2 class="text-2xl font-bold text-slate-950">No matches for your current filters.</h2>
          <p class="mt-3 text-sm text-slate-500">Try another keyword or clear the category filter.</p>
        </div>
      } @else {
        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          @for (product of filteredProducts; track product.id) {
            <app-product-card [product]="product" (addToCart)="onAddToCart($event)"></app-product-card>
          }
        </div>
      }
    </section>
  `,
  styles: [],
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly storeService = inject(StoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  searchTerm = '';
  selectedCategory = '';
  sortBy = 'name';

  ngOnInit(): void {
    this.syncProducts();
    this.productService.loadProducts().subscribe(() => {
      this.syncProducts();
      this.applyFilters();
    });
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm = params.get('search') ?? '';
      this.selectedCategory = params.get('category') ?? '';
      this.sortBy = params.get('sort') ?? 'name';
      this.applyFilters();
    });
  }

  syncProducts(): void {
    this.allProducts = this.productService.getAllProducts();
    this.categories = this.productService.getCategories();
  }

  applyFilters(updateUrl: boolean = false): void {
    const search = this.searchTerm.trim().toLowerCase();
    let results = [...this.allProducts];

    if (search) {
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.description.toLowerCase().includes(search) ||
          product.category.toLowerCase().includes(search) ||
          product.brand.toLowerCase().includes(search),
      );
    }

    if (this.selectedCategory) {
      results = results.filter((product) => product.category === this.selectedCategory);
    }

    this.filteredProducts = this.sortProducts(results);

    if (updateUrl) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: this.searchTerm || null,
          category: this.selectedCategory || null,
          sort: this.sortBy !== 'name' ? this.sortBy : null,
        },
      });
    }
  }

  sortProducts(products: Product[]): Product[] {
    return [...products].sort((left, right) => {
      switch (this.sortBy) {
        case 'price-asc':
          return left.price - right.price;
        case 'price-desc':
          return right.price - left.price;
        case 'rating':
          return right.rating - left.rating || right.reviews - left.reviews;
        default:
          return left.name.localeCompare(right.name);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.applyFilters(true);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.sortBy = 'name';
    this.applyFilters(true);
  }

  onAddToCart(product: Product): void {
    this.storeService.addToCart(product);
  }
}
