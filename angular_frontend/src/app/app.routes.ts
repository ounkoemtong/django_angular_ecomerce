import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AccountComponent } from './pages/account/account.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { ContactComponent } from './pages/contact/contact.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard, staffGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'NovaMart | Home' },
  { path: 'products', component: ProductsComponent, title: 'NovaMart | Products' },
  { path: 'products/:id', component: ProductDetailComponent, title: 'NovaMart | Product Details' },
  { path: 'cart', component: CartComponent, title: 'NovaMart | Cart' },
  { path: 'checkout', component: CheckoutComponent, title: 'NovaMart | Checkout', canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, title: 'NovaMart | Login' },
  { path: 'register', component: RegisterComponent, title: 'NovaMart | Register' },
  { path: 'account', component: AccountComponent, title: 'NovaMart | Account', canActivate: [authGuard] },
  { path: 'orders', component: OrdersComponent, title: 'NovaMart | Orders', canActivate: [authGuard] },
  { path: 'your-orders', component: OrdersComponent, title: 'NovaMart | Your Orders', canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, title: 'NovaMart | Dashboard', canActivate: [staffGuard] },
  { path: 'contact', component: ContactComponent, title: 'NovaMart | Contact' },
  { path: '**', redirectTo: '' },
];
