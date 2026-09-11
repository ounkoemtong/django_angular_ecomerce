export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  imageUrl: string;
  stock: number;
  rating: number;
  reviews: number;
  badge?: string;
  accent: string;
  features: string[];
  isNew?: boolean;
  slug?: string;
  sku?: string;
  categoryId?: number;
  brandId?: number;
  tax?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface OrderPricing {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface Order {
  id: number;
  items: CartItem[];
  pricing: OrderPricing;
  status: string;
  date: Date;
  shippingAddress: ShippingAddress;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  password?: string;
  memberSince: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailVerified?: boolean;
  isStaff?: boolean;
  isActive?: boolean;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
}

export interface CatalogStats {
  totalProducts: number;
  totalCategories: number;
  averagePrice: number;
  inventoryUnits: number;
}

export interface CategorySpotlight {
  name: string;
  productCount: number;
  averagePrice: number;
  accent: string;
}

export interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  email_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

export interface ApiBrand {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

export interface ApiColor {
  id: number;
  name: string;
  code: string;
}

export interface ApiProduct {
  id: number;
  category: number;
  category_name?: string;
  brand: number;
  brand_name?: string;
  colors: number[];
  name: string;
  title: string;
  slug: string;
  sku: string;
  short_description: string;
  specification: string;
  image: string;
  price: string;
  tax: string;
  price_with_tax: string;
  final_price: string;
  discount_amount: string;
  is_active: boolean;
  is_featured: boolean;
  is_digital: boolean;
  published_at: string;
  meta_title: string;
  meta_description: string;
}

export interface ProductPayload {
  category: number;
  brand: number;
  colors?: number[];
  name: string;
  title: string;
  slug: string;
  sku: string;
  short_description?: string;
  specification?: string;
  image?: string;
  price: string;
  tax?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_digital?: boolean;
  meta_title?: string;
  meta_description?: string;
}
