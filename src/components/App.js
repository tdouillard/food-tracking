import { Router } from '../utils/Router.js';
import { StorageService } from '../services/StorageService.js';
import { HomePage } from './HomePage.js';
import { AddMealPage } from './AddMealPage.js';
import { StatsPage } from './StatsPage.js';
import { SettingsPage } from './SettingsPage.js';

export class App {
  constructor() {
    this.router = new Router();
    this.storageService = new StorageService();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.addRoute('/', () => new HomePage());
    this.router.addRoute('/add-meal', () => new AddMealPage());
    this.router.addRoute('/stats', () => new StatsPage());
    this.router.addRoute('/settings', () => new SettingsPage());
  }

  init() {
    this.renderHeader();
    this.renderNavigation();
    this.router.init();
    this.registerServiceWorker();
  }

  renderHeader() {
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="container">
        <h1>🍎 Food Tracking App</h1>
      </div>
    `;
    document.body.insertBefore(header, document.getElementById('app'));
  }

  renderNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.innerHTML = `
      <div class="container">
        <ul class="nav-list">
          <li class="nav-item">
            <a href="#/" class="nav-link" data-route="/">🏠 Home</a>
          </li>
          <li class="nav-item">
            <a href="#/add-meal" class="nav-link" data-route="/add-meal">➕ Add Meal</a>
          </li>
          <li class="nav-item">
            <a href="#/stats" class="nav-link" data-route="/stats">📊 Statistics</a>
          </li>
          <li class="nav-item">
            <a href="#/settings" class="nav-link" data-route="/settings">⚙️ Settings</a>
          </li>
        </ul>
      </div>
    `;

    // Add click handlers for navigation
    nav.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        this.router.navigate(route);
        this.updateActiveNav(route);
      }
    });

    document.body.insertBefore(nav, document.getElementById('app'));
  }

  updateActiveNav(currentRoute) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-route') === currentRoute) {
        link.classList.add('active');
      }
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }
}