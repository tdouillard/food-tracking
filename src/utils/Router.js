export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = '/';
  }

  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  navigate(path) {
    if (this.routes.has(path)) {
      this.currentRoute = path;
      this.render();
      // Update URL hash without triggering hashchange
      history.replaceState(null, null, `#${path}`);
    }
  }

  init() {
    // Handle initial route
    const hash = window.location.hash.slice(1) || '/';
    this.navigate(hash);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || '/';
      if (hash !== this.currentRoute) {
        this.navigate(hash);
      }
    });
  }

  render() {
    const app = document.getElementById('app');
    const handler = this.routes.get(this.currentRoute);
    
    if (handler) {
      const page = handler();
      app.innerHTML = '';
      page.render(app);
    }
  }
}