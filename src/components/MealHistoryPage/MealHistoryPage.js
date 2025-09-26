import { StorageService } from "../../services/StorageService.js";
import { AddMealPage } from "../AddMealPage/AddMealPage.js";
import template from "./MealHistoryPage.html?raw";
import "./MealHistoryPage.css";

export class MealHistoryPage {
  constructor() {
    this.storageService = new StorageService();
    this.allMeals = [];
    this.addMealPageInstance = null;
  }

  async render(container) {
    container.innerHTML = template;
    this.attachEventListeners(container);
    this.loadMealHistory();
    this.attachHistoryFilter();
  }

  attachEventListeners(container) {
    // Sidebar close handlers
    const backdrop = container.querySelector("#sidebar-backdrop");
    const closeBtn = container.querySelector("#sidebar-close");

    backdrop.addEventListener("click", () => this.closeSidebar());
    closeBtn.addEventListener("click", () => this.closeSidebar());

    // ESC key to close sidebar
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeSidebar();
      }
    });
  }

  attachHistoryFilter() {
    const filterInput = document.getElementById("meal-history-filter");
    if (!filterInput) return;
    filterInput.addEventListener("input", () =>
      this.filterMealHistory(filterInput.value.trim().toLowerCase()),
    );
  }

  async loadMealHistory() {
    try {
      const meals = await this.storageService.getMeals();
      this.allMeals = meals.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
      this.renderMealHistory(this.allMeals);
    } catch (e) {
      const list = document.getElementById("meal-history-list");
      if (list)
        list.innerHTML = `<div class="meal-history-empty">Failed to load meals: ${e.message}</div>`;
    }
  }

  filterMealHistory(term) {
    if (!this.allMeals) return;
    if (!term) {
      this.renderMealHistory(this.allMeals);
      return;
    }
    const filtered = this.allMeals.filter((m) =>
      (m.name || "").toLowerCase().includes(term),
    );
    this.renderMealHistory(filtered);
  }

  renderMealHistory(meals) {
    const list = document.getElementById("meal-history-list");
    if (!list) return;

    if (!meals || meals.length === 0) {
      list.innerHTML =
        '<div class="meal-history-empty">No meals saved yet.</div>';
      return;
    }

    list.innerHTML = meals
      .map((m) => {
        const kcal = Math.round(
          m.totalNutrition?.energy || this.computeEnergyFallback(m),
        );
        return `
                    <div class="meal-history-item">
                        <div class="meal-history-item-info">
                            <h4>${m.name || "Meal"}</h4>
                            <div class="meal-history-meta">${this.formatShortDate(m.timestamp)}</div>
                            <div class="meal-history-kcal">${kcal} kcal • ${(m.products || []).length} items</div>
                        </div>
                        <div class="meal-history-actions">
                            <button class="btn btn-sm btn-secondary edit-meal" data-meal-id="${m.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-meal" data-meal-id="${m.id}">Delete</button>
                        </div>
                    </div>
                `;
      })
      .join("");

    // Attach event listeners to action buttons
    list.querySelectorAll(".edit-meal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const mealId = btn.getAttribute("data-meal-id");
        const meal = this.allMeals.find((m) => m.id === mealId);
        if (meal) {
          this.openSidebar("Edit Meal", meal);
        }
      });
    });

    list.querySelectorAll(".delete-meal").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const mealId = btn.getAttribute("data-meal-id");
        if (confirm("Are you sure you want to delete this meal?")) {
          try {
            await this.storageService.deleteMeal(mealId);
            await this.loadMealHistory();
            this.showAlert("Meal deleted successfully!", "success");
          } catch (error) {
            this.showAlert("Failed to delete meal: " + error.message, "error");
          }
        }
      });
    });
  }

  async openSidebar(title, meal = null) {
    const sidebar = document.getElementById("sidebar-overlay");
    const backdrop = document.getElementById("sidebar-backdrop");
    const titleEl = document.getElementById("sidebar-title");
    const contentEl = document.getElementById("sidebar-content");

    titleEl.textContent = title;

    // Create AddMealPage instance
    this.addMealPageInstance = new AddMealPage(meal, true); // In Edit mode

    // Override the save method to refresh the list and close sidebar
    const originalSaveMeal = this.addMealPageInstance.saveMeal.bind(
      this.addMealPageInstance,
    );
    this.addMealPageInstance.saveMeal = async () => {
      await originalSaveMeal();
      await this.loadMealHistory();
      this.closeSidebar();
    };

    // Render AddMealPage content in sidebar
    await this.addMealPageInstance.render(contentEl);
    // Force mobile layout for embedded AddMealPage inside sidebar
    const mealLayoutRoot = contentEl.querySelector(".container.meal-layout");
    if (mealLayoutRoot) {
      mealLayoutRoot.classList.add("force-mobile");
    }

    // Show sidebar
    sidebar.classList.add("open");
    backdrop.classList.add("open");
  }

  closeSidebar() {
    const sidebar = document.getElementById("sidebar-overlay");
    const backdrop = document.getElementById("sidebar-backdrop");

    sidebar.classList.remove("open");
    backdrop.classList.remove("open");

    // Clean up AddMealPage instance
    if (this.addMealPageInstance) {
      this.addMealPageInstance = null;
    }
  }

  computeEnergyFallback(meal) {
    if (!meal.products) return 0;
    return meal.products.reduce(
      (acc, p) =>
        acc + (p.calculatedNutrition?.energy || p.nutrition?.energy || 0),
      0,
    );
  }

  formatShortDate(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  }

  showAlert(message, type) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector(".meal-history-layout");
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  }
}
