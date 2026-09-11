import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(public router: Router) {}

  shouldHideChrome(): boolean {
    return this.router.url === '/login' || this.router.url === '/register';
  }
}
