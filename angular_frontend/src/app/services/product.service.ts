import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { CatalogStats, CategorySpotlight, Product } from '../models/ecommerce.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiService = inject(ApiService);
  private apiProducts: Product[] = [];

  private get activeProducts(): Product[] {
    return this.apiProducts;
  }

  loadProducts(): Observable<Product[]> {
    return this.apiService.getProducts().pipe(
      tap((products) => {
        this.apiProducts = products;
      }),
      catchError(() => {
        this.apiProducts = [];
        return of([]);
      }),
    );
  }

  getAllProducts(): Product[] {
    return [...this.activeProducts];
  }

  getProductById(id: number): Product | undefined {
    return this.activeProducts.find((product) => product.id === id);
  }

  getProductsByCategory(category: string): Product[] {
    return this.activeProducts.filter((product) => product.category === category);
  }

  searchProducts(query: string): Product[] {
    const lowerQuery = query.trim().toLowerCase();
    return this.activeProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.brand.toLowerCase().includes(lowerQuery),
    );
  }

  getCategories(): string[] {
    return [...new Set(this.activeProducts.map((product) => product.category))].sort((left, right) =>
      left.localeCompare(right),
    );
  }

  getCatalogStats(): CatalogStats {
    const products = this.activeProducts;
    const totalProducts = products.length;
    const totalCategories = this.getCategories().length;
    const averagePrice =
      totalProducts === 0 ? 0 : products.reduce((sum, product) => sum + product.price, 0) / totalProducts;
    const inventoryUnits = products.reduce((sum, product) => sum + product.stock, 0);

    return {
      totalProducts,
      totalCategories,
      averagePrice,
      inventoryUnits,
    };
  }

  getFeaturedProducts(limit: number = 6): Product[] {
    return [...this.activeProducts]
      .sort((left, right) => {
        const leftScore = left.rating * left.reviews + (left.badge ? 75 : 0);
        const rightScore = right.rating * right.reviews + (right.badge ? 75 : 0);
        return rightScore - leftScore;
      })
      .slice(0, limit);
  }

  getTrendingProducts(limit: number = 4): Product[] {
    return [...this.activeProducts]
      .sort((left, right) => {
        const leftScore = left.reviews * left.rating + (left.isNew ? 150 : 0);
        const rightScore = right.reviews * right.rating + (right.isNew ? 150 : 0);
        return rightScore - leftScore;
      })
      .slice(0, limit);
  }

  getNewArrivals(limit: number = 4): Product[] {
    return [...this.activeProducts]
      .sort((left, right) => right.id - left.id)
      .slice(0, limit);
  }

  getCategorySpotlights(limit: number = 4): CategorySpotlight[] {
    return this.getCategories()
      .map((category) => {
        const items = this.getProductsByCategory(category);
        return {
          name: category,
          productCount: items.length,
          averagePrice: items.reduce((sum, item) => sum + item.price, 0) / items.length,
          accent: items[0]?.accent ?? 'from-slate-300 to-slate-500',
        };
      })
      .sort((left, right) => right.productCount - left.productCount)
      .slice(0, limit);
  }

  getRelatedProducts(productId: number, limit: number = 4): Product[] {
    const product = this.getProductById(productId);
    if (!product) {
      return [];
    }

    return [...this.activeProducts]
      .filter(
        (item) =>
          item.id !== productId &&
          (item.category === product.category || item.brand === product.brand),
      )
      .sort((left, right) => right.rating - left.rating || right.reviews - left.reviews)
      .slice(0, limit);
  }
}
