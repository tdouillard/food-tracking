import { StorageService } from '../services/StorageService.js';
import { OpenFoodFactsService } from '../services/OpenFoodFactsService.js';

export class AddMealPage {
  constructor() {
    this.storageService = new StorageService();
    this.openFoodFactsService = new OpenFoodFactsService();
    this.selectedProducts = [];
    this.isSearching = false;
  }

  async render(container) {
    container.innerHTML = `
      <div class="container">
        <div class="card">
          <h2>Add New Meal</h2>
          <form id="meal-form">
            <div class="form-group">
              <label class="form-label">Meal Name</label>
              <input type="text" class="form-input" id="meal-name" placeholder="e.g., Breakfast, Lunch, Dinner" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Date & Time</label>
              <input type="datetime-local" class="form-input" id="meal-datetime" required>
            </div>
          </form>
        </div>

        <div class="card">
          <h2>Add Products</h2>
          <div class="form-group">
            <label class="form-label">Search Products</label>
            <div style="position: relative;">
              <input type="text" class="form-input" id="product-search" placeholder="Search for food products..." autocomplete="off">
              <div id="search-results" class="search-results hidden"></div>
            </div>
          </div>

          <div class="form-group">
            <button type="button" class="btn btn-secondary" id="scan-product-barcode">📷 Scan Product Barcode</button>
          </div>

          <div id="selected-products">
            <h3>Selected Products (${this.selectedProducts.length})</h3>
            <div id="products-list">
              ${this.renderProductsList()}
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Meal Summary</h2>
          <div id="meal-nutrition-summary">
            ${this.renderNutritionSummary()}
          </div>
          
          <div class="form-group mt-2">
            <button type="submit" class="btn btn-primary" id="save-meal" ${this.selectedProducts.length === 0 ? 'disabled' : ''}>
              💾 Save Meal
            </button>
            <a href="#/" class="btn btn-secondary">Cancel</a>
          </div>
        </div>
      </div>
    `;

    this.setupDateTime();
    this.attachEventListeners(container);
    this.checkUrlBarcode();
  }

  setupDateTime() {
    const now = new Date();
    const datetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('meal-datetime').value = datetime;
  }

  async checkUrlBarcode() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const barcode = urlParams.get('barcode');
    
    if (barcode) {
      try {
        const product = await this.openFoodFactsService.getProductByBarcode(barcode);
        this.showProductModal(product);
      } catch (error) {
        this.showAlert('Product not found for barcode: ' + barcode, 'error');
      }
    }
  }

  attachEventListeners(container) {
    // Product search
    const searchInput = container.querySelector('#product-search');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        this.hideSearchResults();
        return;
      }

      searchTimeout = setTimeout(() => {
        this.searchProducts(query);
      }, 300);
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#product-search') && !e.target.closest('#search-results')) {
        this.hideSearchResults();
      }
    });

    // Barcode scanning
    container.querySelector('#scan-product-barcode').addEventListener('click', () => {
      this.openBarcodeScanner();
    });

    // Save meal
    container.querySelector('#save-meal').addEventListener('click', (e) => {
      e.preventDefault();
      this.saveMeal();
    });
  }

  async searchProducts(query) {
    if (this.isSearching) return;

    this.isSearching = true;
    const resultsContainer = document.getElementById('search-results');
    
    resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center;"><span class="spinner"></span> Searching...</div>';
    resultsContainer.classList.remove('hidden');

    try {
      const results = await this.openFoodFactsService.searchProducts(query, 1, 10);
      this.displaySearchResults(results.products);
    } catch (error) {
      resultsContainer.innerHTML = '<div style="padding: 1rem; color: #dc3545;">Search failed. Please try again.</div>';
    }

    this.isSearching = false;
  }

  displaySearchResults(products) {
    const resultsContainer = document.getElementById('search-results');
    
    if (products.length === 0) {
      resultsContainer.innerHTML = '<div style="padding: 1rem;">No products found.</div>';
      return;
    }

    resultsContainer.innerHTML = products.map(product => `
      <div class="search-item" data-product-id="${product.id}">
        <div style="display: flex; align-items: center; gap: 1rem;">
          ${product.imageUrl ? `<img src="${product.imageUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" alt="">` : '<div style="width: 50px; height: 50px; background: #f0f0f0; border-radius: 4px;"></div>'}
          <div>
            <strong>${product.name}</strong>
            ${product.brand ? `<br><small>${product.brand}</small>` : ''}
            <br><small>${Math.round(product.nutrition.energy)} kcal/100g</small>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    resultsContainer.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        const productId = item.getAttribute('data-product-id');
        const product = products.find(p => p.id === productId);
        this.showProductModal(product);
        this.hideSearchResults();
      });
    });
  }

  hideSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.classList.add('hidden');
  }

  showProductModal(product) {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div class="card" style="max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
          <h3>Add Product to Meal</h3>
          <div style="display: flex; gap: 1rem; margin: 1rem 0;">
            ${product.imageUrl ? `<img src="${product.imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;" alt="">` : ''}
            <div>
              <strong>${product.name}</strong>
              ${product.brand ? `<br><small>Brand: ${product.brand}</small>` : ''}
              <br><small>${product.categories}</small>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input type="text" class="form-input" id="product-quantity" placeholder="e.g., 100g, 1 cup, 150ml" value="100g" required>
          </div>

          <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <strong>Nutrition per 100g:</strong>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.5rem; font-size: 0.9rem;">
              <div>Energy: ${Math.round(product.nutrition.energy)} kcal</div>
              <div>Proteins: ${Math.round(product.nutrition.proteins)}g</div>
              <div>Carbs: ${Math.round(product.nutrition.carbohydrates)}g</div>
              <div>Fat: ${Math.round(product.nutrition.fat)}g</div>
              <div>Sugars: ${Math.round(product.nutrition.sugars)}g</div>
              <div>Fiber: ${Math.round(product.nutrition.fiber)}g</div>
            </div>
          </div>

          <div class="form-group">
            <button class="btn btn-primary" id="add-product">Add to Meal</button>
            <button class="btn btn-secondary" id="cancel-product">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    modal.querySelector('#add-product').addEventListener('click', () => {
      const quantity = modal.querySelector('#product-quantity').value.trim();
      if (quantity) {
        this.addProductToMeal(product, quantity);
        document.body.removeChild(modal);
      }
    });

    modal.querySelector('#cancel-product').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  addProductToMeal(product, quantity) {
    const productWithQuantity = {
      ...product,
      quantity,
      calculatedNutrition: this.openFoodFactsService.calculateNutritionForQuantity(product, quantity)
    };

    this.selectedProducts.push(productWithQuantity);
    this.updateProductsList();
    this.updateNutritionSummary();
    this.updateSaveButton();
    this.showAlert(`${product.name} added to meal!`, 'success');
  }

  updateProductsList() {
    const container = document.getElementById('products-list');
    container.innerHTML = this.renderProductsList();

    // Add remove handlers
    container.querySelectorAll('.remove-product').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        this.selectedProducts.splice(index, 1);
        this.updateProductsList();
        this.updateNutritionSummary();
        this.updateSaveButton();
      });
    });

    // Update count
    const title = document.querySelector('#selected-products h3');
    title.textContent = `Selected Products (${this.selectedProducts.length})`;
  }

  renderProductsList() {
    if (this.selectedProducts.length === 0) {
      return '<p style="color: #666; text-align: center; padding: 2rem;">No products selected yet.</p>';
    }

    return this.selectedProducts.map((product, index) => `
      <div class="food-item">
        <div class="food-item-info">
          <h4>${product.name}</h4>
          <p>Quantity: ${product.quantity} • ${Math.round(product.calculatedNutrition.energy)} kcal</p>
        </div>
        <div class="food-item-actions">
          <button class="btn btn-danger remove-product" data-index="${index}">Remove</button>
        </div>
      </div>
    `).join('');
  }

  updateNutritionSummary() {
    const container = document.getElementById('meal-nutrition-summary');
    container.innerHTML = this.renderNutritionSummary();
  }

  renderNutritionSummary() {
    const totalNutrition = this.calculateTotalNutrition();
    
    return `
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNutrition.energy)}</div>
          <div class="stat-label">Calories</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNutrition.proteins)}g</div>
          <div class="stat-label">Proteins</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNutrition.carbohydrates)}g</div>
          <div class="stat-label">Carbs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNutrition.fat)}g</div>
          <div class="stat-label">Fats</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNutrition.sugars)}g</div>
          <div class="stat-label">Sugars</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNutrition.fiber)}g</div>
          <div class="stat-label">Fiber</div>
        </div>
      </div>
    `;
  }

  calculateTotalNutrition() {
    return this.selectedProducts.reduce((total, product) => {
      const nutrition = product.calculatedNutrition;
      return {
        energy: total.energy + nutrition.energy,
        proteins: total.proteins + nutrition.proteins,
        carbohydrates: total.carbohydrates + nutrition.carbohydrates,
        fat: total.fat + nutrition.fat,
        sugars: total.sugars + nutrition.sugars,
        saturatedFat: total.saturatedFat + nutrition.saturatedFat,
        fiber: total.fiber + nutrition.fiber,
        sodium: total.sodium + nutrition.sodium,
        salt: total.salt + nutrition.salt,
      };
    }, {
      energy: 0, proteins: 0, carbohydrates: 0, fat: 0,
      sugars: 0, saturatedFat: 0, fiber: 0, sodium: 0, salt: 0
    });
  }

  updateSaveButton() {
    const saveButton = document.getElementById('save-meal');
    saveButton.disabled = this.selectedProducts.length === 0;
  }

  async saveMeal() {
    const mealName = document.getElementById('meal-name').value.trim();
    const mealDateTime = document.getElementById('meal-datetime').value;

    if (!mealName) {
      this.showAlert('Please enter a meal name.', 'error');
      return;
    }

    if (!mealDateTime) {
      this.showAlert('Please select date and time.', 'error');
      return;
    }

    if (this.selectedProducts.length === 0) {
      this.showAlert('Please add at least one product.', 'error');
      return;
    }

    try {
      const meal = {
        name: mealName,
        timestamp: new Date(mealDateTime).toISOString(),
        products: this.selectedProducts,
        totalNutrition: this.calculateTotalNutrition(),
      };

      await this.storageService.saveMeal(meal);
      this.showAlert('Meal saved successfully!', 'success');
      
      // Navigate back to home after short delay
      setTimeout(() => {
        window.location.hash = '/';
      }, 1500);
      
    } catch (error) {
      this.showAlert('Failed to save meal: ' + error.message, 'error');
    }
  }

  openBarcodeScanner() {
    const barcode = prompt('Enter product barcode:');
    if (barcode) {
      this.openFoodFactsService.getProductByBarcode(barcode)
        .then(product => this.showProductModal(product))
        .catch(error => this.showAlert('Product not found: ' + error.message, 'error'));
    }
  }

  showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  }
}