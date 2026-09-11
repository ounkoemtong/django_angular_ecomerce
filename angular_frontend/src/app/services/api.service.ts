import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ApiBrand,
  ApiCategory,
  ApiColor,
  ApiProduct,
  ApiUser,
  Product,
  ProductPayload,
  Order,
  User,
} from '../models/ecommerce.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly backendOrigin = this.getBackendOrigin();
  private readonly baseUrl = `${this.backendOrigin}/api`;
  private readonly mediaBaseUrl = this.backendOrigin;

  getProducts(): Observable<Product[]> {
    return this.http
      .get<ApiProduct[]>(`${this.baseUrl}/products/`, { withCredentials: true })
      .pipe(map((products) => products.map((product) => this.toProduct(product))));
  }

  getManagedProducts(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(`${this.baseUrl}/products/`, { withCredentials: true });
  }

  createProduct(payload: ProductPayload | FormData): Observable<ApiProduct> {
    return this.http.post<ApiProduct>(`${this.baseUrl}/products/`, payload, { withCredentials: true });
  }

  updateProduct(id: number, payload: ProductPayload | FormData): Observable<ApiProduct> {
    return this.http.put<ApiProduct>(`${this.baseUrl}/manage/products/${id}/`, payload, {
      withCredentials: true,
    });
  }

  deleteProduct(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/manage/products/${id}/`, { withCredentials: true });
  }

  getCategories(): Observable<ApiCategory[]> {
    return this.http.get<ApiCategory[]>(`${this.baseUrl}/manage/categories/`, { withCredentials: true });
  }

  createCategory(payload: Omit<ApiCategory, 'id'> | FormData): Observable<ApiCategory> {
    return this.http.post<ApiCategory>(`${this.baseUrl}/manage/categories/`, payload, {
      withCredentials: true,
    });
  }

  updateCategory(id: number, payload: Omit<ApiCategory, 'id'> | FormData): Observable<ApiCategory> {
    return this.http.put<ApiCategory>(`${this.baseUrl}/manage/categories/${id}/`, payload, {
      withCredentials: true,
    });
  }

  deleteCategory(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/manage/categories/${id}/`, { withCredentials: true });
  }

  getBrands(): Observable<ApiBrand[]> {
    return this.http.get<ApiBrand[]>(`${this.baseUrl}/manage/brands/`, { withCredentials: true });
  }

  createBrand(payload: Omit<ApiBrand, 'id'> | FormData): Observable<ApiBrand> {
    return this.http.post<ApiBrand>(`${this.baseUrl}/manage/brands/`, payload, { withCredentials: true });
  }

  updateBrand(id: number, payload: Omit<ApiBrand, 'id'> | FormData): Observable<ApiBrand> {
    return this.http.put<ApiBrand>(`${this.baseUrl}/manage/brands/${id}/`, payload, {
      withCredentials: true,
    });
  }

  deleteBrand(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/manage/brands/${id}/`, { withCredentials: true });
  }

  getColors(): Observable<ApiColor[]> {
    return this.http.get<ApiColor[]>(`${this.baseUrl}/manage/colors/`, { withCredentials: true });
  }

  getUsers(): Observable<ApiUser[]> {
    return this.http.get<ApiUser[]>(`${this.baseUrl}/manage/users/`, { withCredentials: true });
  }

  updateUser(id: number, payload: Partial<ApiUser> & { password?: string }): Observable<ApiUser> {
    return this.http.patch<ApiUser>(`${this.baseUrl}/manage/users/${id}/`, payload, {
      withCredentials: true,
    });
  }

  createColor(payload: Omit<ApiColor, 'id'>): Observable<ApiColor> {
    return this.http.post<ApiColor>(`${this.baseUrl}/manage/colors/`, payload, { withCredentials: true });
  }

  updateColor(id: number, payload: Omit<ApiColor, 'id'>): Observable<ApiColor> {
    return this.http.put<ApiColor>(`${this.baseUrl}/manage/colors/${id}/`, payload, {
      withCredentials: true,
    });
  }

  deleteColor(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/manage/colors/${id}/`, { withCredentials: true });
  }

  login(username: string, password: string): Observable<User> {
    return this.http
      .post<{ user: ApiUser }>(
        `${this.baseUrl}/auth/login/`,
        { username, password },
        { withCredentials: true },
      )
      .pipe(map((response) => this.toUser(response.user)));
  }

  register(payload: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Observable<User> {
    return this.http
      .post<{ user: ApiUser }>(`${this.baseUrl}/auth/register/`, payload, { withCredentials: true })
      .pipe(map((response) => this.toUser(response.user)));
  }

  getProfile(): Observable<User> {
    return this.http
      .get<ApiUser>(`${this.baseUrl}/auth/profile/`, { withCredentials: true })
      .pipe(map((user) => this.toUser(user)));
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/auth/logout/`, {}, { withCredentials: true });
  }

  notifyOrder(order: Order): Observable<{ sent: boolean; message: string }> {
    return this.http.post<{ sent: boolean; message: string }>(
      `${this.baseUrl}/orders/notify/`,
      { order },
      { withCredentials: true },
    );
  }

  notifyContactMessage(payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Observable<{ sent: boolean; message: string }> {
    return this.http.post<{ sent: boolean; message: string }>(`${this.baseUrl}/contact/notify/`, payload, {
      withCredentials: true,
    });
  }

  private toProduct(product: ApiProduct): Product {
    const price = Number(product.final_price || product.price || 0);
    const originalPrice = Number(product.price_with_tax || product.price || price);
    const imageUrl = this.toMediaUrl(product.image);

    return {
      id: product.id,
      name: product.title || product.name,
      description: product.short_description || product.specification || 'No description yet.',
      price,
      originalPrice: originalPrice > price ? originalPrice : undefined,
      category: product.category_name || `Category #${product.category}`,
      brand: product.brand_name || `Brand #${product.brand}`,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
      stock: product.is_active ? 25 : 0,
      rating: product.is_featured ? 4.8 : 4.5,
      reviews: Math.max(24, product.id * 17),
      badge: product.is_featured ? 'Featured' : undefined,
      accent: product.is_featured
        ? 'from-amber-300 via-orange-300 to-rose-300'
        : 'from-sky-200 via-cyan-200 to-emerald-200',
      features: [product.sku, product.is_digital ? 'Digital' : 'Ships fast'].filter(Boolean),
      isNew: product.is_featured,
      slug: product.slug,
      sku: product.sku,
      categoryId: product.category,
      brandId: product.brand,
      tax: Number(product.tax || 0),
      isActive: product.is_active,
      isFeatured: product.is_featured,
    };
  }

  private toUser(user: ApiUser): User {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
    return {
      id: user.id,
      email: user.email,
      name,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      emailVerified: user.email_verified,
      isStaff: user.is_staff,
      isActive: user.is_active,
      memberSince: new Date(user.date_joined).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    };
  }

  private toMediaUrl(value: string): string {
    if (!value) {
      return '';
    }
    return value.startsWith('http') ? value : `${this.mediaBaseUrl}${value}`;
  }

  private getBackendOrigin(): string {
    if (typeof window === 'undefined') {
      return 'http://localhost:8000';
    }
    return `http://${window.location.hostname}:8000`;
  }
}
