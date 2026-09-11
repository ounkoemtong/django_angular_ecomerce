import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import {
  AuthResult,
  CartItem,
  Order,
  OrderPricing,
  Product,
  ShippingAddress,
  User,
} from '../models/ecommerce.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiService = inject(ApiService);
  private readonly storageKey = {
    cart: 'eshop-cart',
    orders: 'eshop-orders',
    user: 'eshop-user',
  } as const;

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  cart$ = this.cartSubject.asObservable();
  orders$ = this.ordersSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  private cart: CartItem[] = [];
  private orders: Order[] = [];

  constructor() {
    this.restoreState();
    this.restoreProfile();
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private restoreState(): void {
    if (!this.isBrowser) {
      return;
    }

    this.cart = this.readStorage<CartItem[]>(this.storageKey.cart, []);
    this.orders = this.readStorage<Order[]>(this.storageKey.orders, []).map((order) => ({
      ...order,
      date: new Date(order.date),
    }));

    const storedUser = this.readStorage<User | null>(this.storageKey.user, null);
    this.currentUserSubject.next(storedUser);
    this.cartSubject.next([...this.cart]);
    this.ordersSubject.next([...this.orders]);
  }

  private readStorage<T>(key: string, fallback: T): T {
    if (!this.isBrowser) {
      return fallback;
    }

    try {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private writeStorage(key: string, value: unknown): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  private syncCart(): void {
    this.cartSubject.next([...this.cart]);
    this.writeStorage(this.storageKey.cart, this.cart);
  }

  private syncOrders(): void {
    this.ordersSubject.next([...this.orders]);
    this.writeStorage(this.storageKey.orders, this.orders);
  }

  private syncUser(user: User | null): void {
    this.currentUserSubject.next(user);
    this.writeStorage(this.storageKey.user, user);
  }

  getCart(): CartItem[] {
    return [...this.cart];
  }

  addToCart(product: Product, quantity: number = 1): void {
    const existingItem = this.cart.find((item) => item.product.id === product.id);
    const safeQuantity = Math.max(1, quantity);

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + safeQuantity, product.stock);
    } else {
      this.cart.push({ product, quantity: Math.min(safeQuantity, product.stock) });
    }
    this.syncCart();
  }

  updateQuantity(productId: number, quantity: number): void {
    const item = this.cart.find((i) => i.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = Math.min(quantity, item.product.stock);
        this.syncCart();
      }
    }
  }

  removeFromCart(productId: number): void {
    this.cart = this.cart.filter((item) => item.product.id !== productId);
    this.syncCart();
  }

  clearCart(): void {
    this.cart = [];
    this.syncCart();
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  getCartSummary(): OrderPricing {
    const subtotal = this.getCartTotal();
    const shipping = subtotal === 0 || subtotal > 50 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }

  getCartSavings(): number {
    return this.cart.reduce((sum, item) => {
      const originalPrice = item.product.originalPrice ?? item.product.price;
      return sum + Math.max(0, originalPrice - item.product.price) * item.quantity;
    }, 0);
  }

  placeOrder(details: {
    shippingAddress: ShippingAddress;
    email: string;
    phone?: string;
    paymentMethod: string;
  }): Order {
    const pricing = this.getCartSummary();
    const order: Order = {
      id: Date.now(),
      items: [...this.cart],
      pricing,
      status: 'Confirmed',
      date: new Date(),
      shippingAddress: details.shippingAddress,
      customerEmail: details.email,
      customerPhone: details.phone,
      paymentMethod: details.paymentMethod,
    };

    this.orders.unshift(order);
    this.syncOrders();
    this.clearCart();
    return order;
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  getLifetimeSpend(): number {
    return this.orders.reduce((sum, order) => sum + order.pricing.total, 0);
  }

  getAverageOrderValue(): number {
    if (this.orders.length === 0) {
      return 0;
    }
    return this.getLifetimeSpend() / this.orders.length;
  }

  restoreProfile(): void {
    this.apiService
      .getProfile()
      .pipe(catchError(() => of(null)))
      .subscribe((user) => {
        if (user) {
          this.syncUser(user);
        } else {
          this.syncUser(null);
        }
      });
  }

  validateSession(): Observable<boolean> {
    return this.apiService.getProfile().pipe(
      tap((user) => this.syncUser(user)),
      map(() => true),
      catchError(() => {
        this.syncUser(null);
        return of(false);
      }),
    );
  }

  login(username: string, password: string): Observable<boolean> {
    return this.loginResult(username, password).pipe(map((result) => result.success));
  }

  loginResult(username: string, password: string): Observable<AuthResult> {
    if (!username.trim() || !password) {
      return of({ success: false, message: 'Enter your email or username and password.' });
    }

    return this.apiService.login(username.trim(), password).pipe(
      tap((user) => this.syncUser(user)),
      map((user) => ({ success: true, message: 'Welcome back.', user })),
      catchError((error: unknown) =>
        of({ success: false, message: this.getAuthErrorMessage(error, 'Login failed. Please try again.') }),
      ),
    );
  }

  register(email: string, password: string, name: string): Observable<boolean> {
    return this.registerResult(email, password, name).pipe(map((result) => result.success));
  }

  registerResult(email: string, password: string, name: string): Observable<AuthResult> {
    if (!email.trim() || !password || !name.trim()) {
      return of({ success: false, message: 'Name, email, and password are required.' });
    }

    const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
    return this.apiService
      .register({
        username: email,
        email,
        password,
        first_name: firstName || name,
        last_name: lastNameParts.join(' '),
      })
      .pipe(
        tap((user) => this.syncUser(user)),
        map((user) => ({ success: true, message: 'Account created. Check the Django terminal for your OTP code.', user })),
        catchError((error: unknown) =>
          of({ success: false, message: this.getAuthErrorMessage(error, 'Could not create your account.') }),
        ),
      );
  }

  logout(): void {
    this.apiService.logout().pipe(catchError(() => of(null))).subscribe();
    this.syncUser(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getAuthErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const detail = error.error?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
    }
    return fallback;
  }
}
