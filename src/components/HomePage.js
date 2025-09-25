import { StorageService } from '../services/StorageService.js';
import { format, startOfDay, endOfDay } from 'date-fns';

export class HomePage {
  constructor() {
    this.storageService = new StorageService();
  }

  async render(container) {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    try {
      const todaysMeals = await this.storageService.getMeals(
        startOfToday.toISOString(),
        endOfToday.toISOString()
      );

      const todaysNutrition = this.calculateTotalNutrition(todaysMeals);

      container.innerHTML = `
        <div class="container">
          <div class="card">
            <h2>Today's Overview - ${format(today, 'EEEE, MMMM do, yyyy')}</h2>
            <div class="grid grid-2">
              ${this.renderNutritionSummary(todaysNutrition)}
              ${this.renderQuickActions()}
            </div>
          </div>

          <div class="card">
            <h2>Today's Meals (${todaysMeals.length})</h2>
            ${todaysMeals.length > 0 
              ? this.renderMealsList(todaysMeals)
              : this.renderEmptyState()
            }
          </div>
        </div>
      `;

      this.attachEventListeners(container);
    } catch (error) {
      container.innerHTML = `
        <div class="container">
          <div class="alert alert-error">
            <strong>Error:</strong> Failed to load today's data. ${error.message}
          </div>
        </div>
      `;
    }
  }

  renderNutritionSummary(nutrition) {
    return `
      <div>
        <h3>Nutrition Summary</h3>
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div class="stat-card">
            <div class="stat-number">${Math.round(nutrition.energy)}</div>
            <div class="stat-label">Calories</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${Math.round(nutrition.proteins)}g</div>
            <div class="stat-label">Proteins</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${Math.round(nutrition.carbohydrates)}g</div>
            <div class="stat-label">Carbs</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${Math.round(nutrition.fat)}g</div>
            <div class="stat-label">Fats</div>
          </div>
        </div>
      </div>
    `;
  }

  renderQuickActions() {
    return `
      <div>
        <h3>Quick Actions</h3>
        <div style="margin-top: 1rem;">
          <a href="#/add-meal" class="btn btn-primary">➕ Add Meal</a>
          <a href="#/stats" class="btn btn-secondary">📊 View Statistics</a>
          <button class="btn btn-secondary" id="scan-barcode">📷 Scan Barcode</button>
        </div>
      </div>
    `;
  }

  renderMealsList(meals) {
    return `
      <div class="meals-list">
        ${meals.map(meal => `
          <div class="food-item" data-meal-id="${meal.id}">
            <div class="food-item-info">
              <h4>${meal.name}</h4>
              <p>
                ${format(new Date(meal.timestamp), 'HH:mm')} • 
                ${Math.round(meal.totalNutrition?.energy || 0)} cal •
                ${meal.products?.length || 0} product${meal.products?.length !== 1 ? 's' : ''}
              </p>
              ${meal.products ? meal.products.map(product => `
                <p style="margin-left: 1rem; color: #888; font-size: 0.8rem;">
                  ${product.name} (${product.quantity})
                </p>
              `).join('') : ''}
            </div>
            <div class="food-item-actions">
              <button class="btn btn-danger btn-sm delete-meal" data-meal-id="${meal.id}">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="text-center" style="padding: 2rem; color: #666;">
        <p>No meals recorded today.</p>
        <a href="#/add-meal" class="btn btn-primary" style="margin-top: 1rem;">Add Your First Meal</a>
      </div>
    `;
  }

  calculateTotalNutrition(meals) {
    return meals.reduce((total, meal) => {
      const mealNutrition = meal.totalNutrition || {
        energy: 0, proteins: 0, carbohydrates: 0, fat: 0,
        sugars: 0, saturatedFat: 0, fiber: 0, sodium: 0, salt: 0
      };

      return {
        energy: total.energy + (mealNutrition.energy || 0),
        proteins: total.proteins + (mealNutrition.proteins || 0),
        carbohydrates: total.carbohydrates + (mealNutrition.carbohydrates || 0),
        fat: total.fat + (mealNutrition.fat || 0),
        sugars: total.sugars + (mealNutrition.sugars || 0),
        saturatedFat: total.saturatedFat + (mealNutrition.saturatedFat || 0),
        fiber: total.fiber + (mealNutrition.fiber || 0),
        sodium: total.sodium + (mealNutrition.sodium || 0),
        salt: total.salt + (mealNutrition.salt || 0),
      };
    }, {
      energy: 0, proteins: 0, carbohydrates: 0, fat: 0,
      sugars: 0, saturatedFat: 0, fiber: 0, sodium: 0, salt: 0
    });
  }

  attachEventListeners(container) {
    // Delete meal handlers
    container.querySelectorAll('.delete-meal').forEach(button => {
      button.addEventListener('click', async (e) => {
        const mealId = e.target.getAttribute('data-meal-id');
        if (confirm('Are you sure you want to delete this meal?')) {
          try {
            await this.storageService.deleteMeal(mealId);
            // Refresh the page
            this.render(container);
          } catch (error) {
            alert('Failed to delete meal: ' + error.message);
          }
        }
      });
    });

    // Barcode scan handler
    const scanButton = container.querySelector('#scan-barcode');
    if (scanButton) {
      scanButton.addEventListener('click', () => {
        this.openBarcodeScanner();
      });
    }
  }

  openBarcodeScanner() {
    // For now, show a simple prompt - we'll implement camera scanning later
    const barcode = prompt('Enter barcode (or use camera scanning in future version):');
    if (barcode) {
      // Navigate to add meal page with barcode
      window.location.hash = `/add-meal?barcode=${barcode}`;
    }
  }
}