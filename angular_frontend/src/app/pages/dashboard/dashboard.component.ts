import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiBrand, ApiCategory, ApiColor, ApiProduct, ApiUser, ProductPayload } from '../../models/ecommerce.model';
import { ApiService } from '../../services/api.service';

type DashboardTab = 'products' | 'categories' | 'brands' | 'colors' | 'users';

interface ProductForm extends ProductPayload {
  id: number | null;
}

interface SimpleEntityForm {
  id: number | null;
  name: string;
  slug: string;
  image: string;
  code: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="section-shell py-8 sm:py-10">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="eyebrow">Staff dashboard</p>
          <h1 class="mt-2 text-4xl font-bold text-slate-950">Manage catalog and account roles.</h1>
        </div>
        <a routerLink="/products" class="text-sm font-bold text-slate-600 transition hover:text-slate-950">
          View storefront
        </a>
      </div>

      @if (error) {
        <div class="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {{ error }}
        </div>
      }

      @if (message) {
        <div class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {{ message }}
        </div>
      }

      <div class="mt-8 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        @for (tab of tabs; track tab.value) {
          <button
            type="button"
            (click)="activeTab = tab.value"
            [class]="activeTab === tab.value ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-700'"
            class="rounded-md px-4 py-2 text-sm font-bold transition"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (activeTab === 'products') {
        <div class="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" (ngSubmit)="saveProduct()">
            <h2 class="text-2xl font-bold text-slate-950">{{ productForm.id ? 'Edit product' : 'Create product' }}</h2>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Title
                <input name="productTitle" [(ngModel)]="productForm.title" required class="rounded-md border border-slate-200 px-3 py-2" />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Slug
                <input name="productSlug" [(ngModel)]="productForm.slug" required class="rounded-md border border-slate-200 px-3 py-2" />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                SKU
                <input name="productSku" [(ngModel)]="productForm.sku" required class="rounded-md border border-slate-200 px-3 py-2" />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Price
                <input name="productPrice" [(ngModel)]="productForm.price" required type="number" min="0" step="0.01" class="rounded-md border border-slate-200 px-3 py-2" />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Category
                <select name="productCategory" [(ngModel)]="productForm.category" required class="rounded-md border border-slate-200 px-3 py-2">
                  @for (category of categories; track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Brand
                <select name="productBrand" [(ngModel)]="productForm.brand" required class="rounded-md border border-slate-200 px-3 py-2">
                  @for (brand of brands; track brand.id) {
                    <option [ngValue]="brand.id">{{ brand.name }}</option>
                  }
                </select>
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                Product image
                <input
                  type="file"
                  accept="image/*"
                  name="productImageFile"
                  (change)="onProductImageSelected($event)"
                  class="rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
              @if (productImagePreview) {
                <div class="md:col-span-2">
                  <img
                    [src]="productImagePreview"
                    [alt]="productForm.title || 'Product preview'"
                    class="h-40 w-40 rounded-lg border border-slate-200 object-cover"
                  />
                </div>
              }
              <label class="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                Short description
                <textarea name="productDescription" [(ngModel)]="productForm.short_description" rows="3" class="rounded-md border border-slate-200 px-3 py-2"></textarea>
              </label>
            </div>
            <div class="mt-5 flex flex-wrap items-center gap-4">
              <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input name="productActive" type="checkbox" [(ngModel)]="productForm.is_active" />
                Active
              </label>
              <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input name="productFeatured" type="checkbox" [(ngModel)]="productForm.is_featured" />
                Featured
              </label>
            </div>
            <div class="mt-6 flex gap-3">
              <button type="submit" class="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                {{ productForm.id ? 'Save product' : 'Create product' }}
              </button>
              <button type="button" (click)="resetProductForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">
                Clear
              </button>
            </div>
          </form>

            <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div class="grid grid-cols-[88px_1fr_auto_auto] gap-3 border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                <span>Image</span>
                <span>Product</span>
                <span>Price</span>
                <span>Actions</span>
              </div>
              @for (product of products; track product.id) {
                <div class="grid grid-cols-[88px_1fr_auto_auto] items-center gap-3 border-b border-slate-100 px-4 py-4">
                  <div class="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    @if (product.image) {
                      <img [src]="resolveMediaUrl(product.image)" [alt]="product.title" class="h-full w-full object-cover" />
                    } @else {
                      <div class="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">No image</div>
                    }
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-bold text-slate-950">{{ product.title }}</p>
                    <p class="truncate text-sm text-slate-500">{{ product.brand_name }} / {{ product.category_name }}</p>
                </div>
                <span class="font-bold text-slate-950">\${{ product.final_price }}</span>
                <div class="flex gap-2">
                  <button type="button" (click)="editProduct(product)" class="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">Edit</button>
                  <button type="button" (click)="deleteProduct(product.id)" class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Delete</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab === 'categories' || activeTab === 'brands' || activeTab === 'colors') {
        <div class="mt-8 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <form class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" (ngSubmit)="saveSimpleEntity()">
            <h2 class="text-2xl font-bold text-slate-950">Manage {{ activeTab }}</h2>
            <label class="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
              Name
              <input name="entityName" [(ngModel)]="entityForm.name" required class="rounded-md border border-slate-200 px-3 py-2" />
            </label>
            @if (activeTab === 'colors') {
              <label class="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                Color code
                <input name="entityCode" [(ngModel)]="entityForm.code" required class="rounded-md border border-slate-200 px-3 py-2" />
              </label>
            } @else {
              <label class="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                Slug
                <input name="entitySlug" [(ngModel)]="entityForm.slug" required class="rounded-md border border-slate-200 px-3 py-2" />
              </label>
              <label class="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                Image file
                <input
                  type="file"
                  accept="image/*"
                  name="entityImageFile"
                  (change)="onEntityImageSelected($event)"
                  class="rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
              @if (entityImagePreview) {
                <div class="mt-4">
                  <img
                    [src]="entityImagePreview"
                    [alt]="entityForm.name || 'Entity preview'"
                    class="h-32 w-32 rounded-lg border border-slate-200 object-cover"
                  />
                </div>
              }
            }
            <div class="mt-6 flex gap-3">
              <button type="submit" class="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                {{ entityForm.id ? 'Save' : 'Create' }}
              </button>
              <button type="button" (click)="resetEntityForm()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">
                Clear
              </button>
            </div>
          </form>

          <div class="grid gap-3">
            @for (item of activeItems; track item.id) {
              <div class="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div class="min-w-0">
                  <p class="truncate font-bold text-slate-950">{{ item.name }}</p>
                  <p class="truncate text-sm text-slate-500">{{ itemLabel(item) }}</p>
                  @if (itemImage(item)) {
                    <img
                      [src]="resolveMediaUrl(itemImage(item))"
                      [alt]="item.name"
                      class="mt-3 h-16 w-16 rounded-lg border border-slate-200 object-cover"
                    />
                  }
                </div>
                <div class="flex gap-2">
                  <button type="button" (click)="editSimpleEntity(item)" class="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">Edit</button>
                  <button type="button" (click)="deleteSimpleEntity(item.id)" class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Delete</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab === 'users') {
        <div class="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_120px_110px] gap-3 border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            <span>Account</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          @for (user of users; track user.id) {
            <div class="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_120px_110px] items-center gap-3 border-b border-slate-100 px-4 py-4">
              <div class="min-w-0">
                <p class="truncate font-bold text-slate-950">{{ user.first_name || user.username }}</p>
                <p class="truncate text-sm text-slate-500">@{{ user.username }}</p>
              </div>
              <p class="truncate text-sm text-slate-600">{{ user.email }}</p>
              <select
                class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                [ngModel]="user.is_staff ? 'staff' : 'user'"
                (ngModelChange)="setUserRole(user, $event)"
                [name]="'user-role-' + user.id"
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
              </select>
              <span
                class="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold"
                [class]="user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ user.is_active ? 'Active' : 'Disabled' }}
              </span>
              <button
                type="button"
                (click)="saveUserRole(user)"
                class="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
              >
                Save
              </button>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [],
})
export class DashboardComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly tabs: { value: DashboardTab; label: string }[] = [
    { value: 'products', label: 'Products' },
    { value: 'categories', label: 'Categories' },
    { value: 'brands', label: 'Brands' },
    { value: 'colors', label: 'Colors' },
    { value: 'users', label: 'Users' },
  ];

  activeTab: DashboardTab = 'products';
  products: ApiProduct[] = [];
  categories: ApiCategory[] = [];
  brands: ApiBrand[] = [];
  colors: ApiColor[] = [];
  users: ApiUser[] = [];
  error = '';
  message = '';

  productForm: ProductForm = this.emptyProductForm();
  entityForm: SimpleEntityForm = { id: null, name: '', slug: '', image: '', code: '#000000' };
  productImageFile: File | null = null;
  entityImageFile: File | null = null;
  productImagePreview = '';
  entityImagePreview = '';

  get activeItems(): Array<ApiCategory | ApiBrand | ApiColor> {
    if (this.activeTab === 'categories') {
      return this.categories;
    }
    if (this.activeTab === 'brands') {
      return this.brands;
    }
    return this.colors;
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.error = '';
    this.apiService.getManagedProducts().subscribe({
      next: (products) => (this.products = products),
      error: (error: unknown) => this.handleError(error),
    });
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        if (!this.productForm.category && categories[0]) {
          this.productForm.category = categories[0].id;
        }
      },
      error: (error: unknown) => this.handleError(error),
    });
    this.apiService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        if (!this.productForm.brand && brands[0]) {
          this.productForm.brand = brands[0].id;
        }
      },
      error: (error: unknown) => this.handleError(error),
    });
    this.apiService.getColors().subscribe({
      next: (colors) => (this.colors = colors),
      error: (error: unknown) => this.handleError(error),
    });
    this.apiService.getUsers().subscribe({
      next: (users) => (this.users = users),
      error: (error: unknown) => this.handleError(error),
    });
  }

  saveProduct(): void {
    const payload: ProductPayload = { ...this.productForm, name: this.productForm.title };
    const request = this.productForm.id
      ? this.apiService.updateProduct(this.productForm.id, this.withOptionalImageUpload(payload, this.productImageFile))
      : this.apiService.createProduct(this.withOptionalImageUpload(payload, this.productImageFile));

    request.subscribe({
      next: () => {
        this.message = this.productForm.id ? 'Product updated.' : 'Product created.';
        this.resetProductForm();
        this.loadDashboard();
      },
      error: (error: unknown) => this.handleError(error),
    });
  }

  editProduct(product: ApiProduct): void {
    this.productForm = {
      id: product.id,
      category: product.category,
      brand: product.brand,
      colors: product.colors,
      name: product.name,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      short_description: product.short_description,
      specification: product.specification,
      image: product.image,
      price: product.price,
      tax: product.tax,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_digital: product.is_digital,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
    };
    this.productImageFile = null;
    this.productImagePreview = this.resolveMediaUrl(product.image);
  }

  deleteProduct(id: number): void {
    this.apiService.deleteProduct(id).subscribe({
      next: () => {
        this.message = 'Product deleted.';
        this.loadDashboard();
      },
      error: (error: unknown) => this.handleError(error),
    });
  }

  resetProductForm(): void {
    this.productForm = this.emptyProductForm();
    this.productImageFile = null;
    this.productImagePreview = '';
  }

  saveSimpleEntity(): void {
    if (this.activeTab === 'categories') {
      const payload = { name: this.entityForm.name, slug: this.entityForm.slug, image: this.entityForm.image };
      const request = this.entityForm.id
        ? this.apiService.updateCategory(this.entityForm.id, this.withOptionalImageUpload(payload, this.entityImageFile))
        : this.apiService.createCategory(this.withOptionalImageUpload(payload, this.entityImageFile));
      request.subscribe({
        next: () => this.afterEntitySaved(),
        error: (error: unknown) => this.handleError(error),
      });
      return;
    }

    if (this.activeTab === 'brands') {
      const payload = { name: this.entityForm.name, slug: this.entityForm.slug, image: this.entityForm.image };
      const request = this.entityForm.id
        ? this.apiService.updateBrand(this.entityForm.id, this.withOptionalImageUpload(payload, this.entityImageFile))
        : this.apiService.createBrand(this.withOptionalImageUpload(payload, this.entityImageFile));
      request.subscribe({
        next: () => this.afterEntitySaved(),
        error: (error: unknown) => this.handleError(error),
      });
      return;
    }

    const payload = { name: this.entityForm.name, code: this.entityForm.code };
    const request = this.entityForm.id
      ? this.apiService.updateColor(this.entityForm.id, payload)
      : this.apiService.createColor(payload);
    request.subscribe({
      next: () => this.afterEntitySaved(),
      error: (error: unknown) => this.handleError(error),
    });
  }

  editSimpleEntity(item: ApiCategory | ApiBrand | ApiColor): void {
    this.entityForm = {
      id: item.id,
      name: item.name,
      slug: 'slug' in item ? item.slug : '',
      image: 'image' in item ? item.image || '' : '',
      code: 'code' in item ? item.code : '#000000',
    };
    this.entityImageFile = null;
    this.entityImagePreview = 'image' in item ? this.resolveMediaUrl(item.image) : '';
  }

  deleteSimpleEntity(id: number): void {
    const request =
      this.activeTab === 'categories'
        ? this.apiService.deleteCategory(id)
        : this.activeTab === 'brands'
          ? this.apiService.deleteBrand(id)
          : this.apiService.deleteColor(id);

    request.subscribe({
      next: () => {
        this.message = 'Item deleted.';
        this.loadDashboard();
      },
      error: (error: unknown) => this.handleError(error),
    });
  }

  resetEntityForm(): void {
    this.entityForm = { id: null, name: '', slug: '', image: '', code: '#000000' };
    this.entityImageFile = null;
    this.entityImagePreview = '';
  }

  itemLabel(item: ApiCategory | ApiBrand | ApiColor): string {
    if ('code' in item) {
      return item.code;
    }
    return item.slug;
  }

  itemImage(item: ApiCategory | ApiBrand | ApiColor): string {
    return 'image' in item ? item.image || '' : '';
  }

  onProductImageSelected(event: Event): void {
    const file = this.readSelectedFile(event);
    this.productImageFile = file;
    if (!file) {
      this.productImagePreview = this.resolveMediaUrl(this.productForm.image);
      return;
    }
    this.loadPreview(file, (preview) => {
      this.productImagePreview = preview;
    });
  }

  onEntityImageSelected(event: Event): void {
    const file = this.readSelectedFile(event);
    this.entityImageFile = file;
    if (!file) {
      this.entityImagePreview = this.resolveMediaUrl(this.entityForm.image);
      return;
    }
    this.loadPreview(file, (preview) => {
      this.entityImagePreview = preview;
    });
  }

  setUserRole(user: ApiUser, role: string): void {
    user.is_staff = role === 'staff';
  }

  saveUserRole(user: ApiUser): void {
    this.apiService
      .updateUser(user.id, {
        is_staff: user.is_staff,
      })
      .subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex((entry) => entry.id === updatedUser.id);
          if (index >= 0) {
            this.users[index] = updatedUser;
          }
          this.message = `Role updated for ${updatedUser.username}.`;
          this.error = '';
        },
        error: (error: unknown) => this.handleError(error),
      });
  }

  private afterEntitySaved(): void {
    this.message = 'Item saved.';
    this.resetEntityForm();
    this.loadDashboard();
  }

  resolveMediaUrl(value?: string): string {
    if (!value) {
      return '';
    }
    return value.startsWith('http') ? value : `http://${window.location.hostname}:8000${value}`;
  }

  private withOptionalImageUpload<T extends { image?: string }>(payload: T, file: File | null): T | FormData {
    if (!file) {
      return payload;
    }

    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    formData.append('image', file);
    return formData;
  }

  private readSelectedFile(event: Event): File | null {
    const input = event.target as HTMLInputElement | null;
    return input?.files?.[0] ?? null;
  }

  private loadPreview(file: File, onLoad: (result: string) => void): void {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoad(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  private emptyProductForm(): ProductForm {
    return {
      id: null,
      category: this.categories[0]?.id ?? 0,
      brand: this.brands[0]?.id ?? 0,
      colors: [],
      name: '',
      title: '',
      slug: '',
      sku: '',
      short_description: '',
      specification: '',
      image: '',
      price: '0.00',
      tax: '0.00',
      is_active: true,
      is_featured: false,
      is_digital: false,
      meta_title: '',
      meta_description: '',
    };
  }

  private handleError(error: unknown): void {
    this.message = '';
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = (error as { error?: { detail?: string } }).error;
      this.error = apiError?.detail || 'API request failed.';
      return;
    }
    this.error = 'API request failed.';
  }
}
