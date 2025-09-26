import { get, set, del, keys, update } from "idb-keyval";

export class StorageService {
  constructor() {
    this.storageType = localStorage.getItem("storage-type") || "local";
    this.apiUrl = localStorage.getItem("api-url") || "";
    this.authToken = localStorage.getItem("auth-token") || "";
  }

  setStorageType(type) {
    this.storageType = type;
    localStorage.setItem("storage-type", type);
  }

  setApiUrl(url) {
    this.apiUrl = url;
    localStorage.setItem("api-url", url);
  }

  setAuthToken(token) {
    this.authToken = token;
    localStorage.setItem("auth-token", token);
  }
  async updateMeal(meal) {
    if (!meal.id) {
      throw new Error("Meal ID is required for update");
    }

    meal.updatedAt = new Date().toISOString();

    if (this.storageType === "local") {
      await this.updateMealLocal(meal);
    } else {
      await this.updateMealRemote(meal);
    }
    return meal.id;
  }

  async updateMealLocal(meal) {
    const existingMeal = await get(`meal_${meal.id}`);
    if (!existingMeal) {
      throw new Error("Meal not found");
    }
    await update(`meal_${meal.id}`, (existingMeal) => meal);
  }

  async updateMealRemote(meal) {
    if (!this.apiUrl) {
      throw new Error("API URL not configured");
    }

    const response = await fetch(`${this.apiUrl}/meals/${meal.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(meal),
    });

    if (!response.ok) {
      throw new Error("Failed to update meal in remote storage");
    }

    return await response.json();
  }

  // Meals
  async saveMeal(meal) {
    const mealId = meal.id || `meal_${Date.now()}_${Math.random()}`;
    meal.id = mealId;
    meal.timestamp = meal.timestamp || new Date().toISOString();

    if (this.storageType === "local") {
      await set(`meal_${mealId}`, meal);
    } else {
      await this.saveMealRemote(meal);
    }
    return mealId;
  }

  async getMeals(startDate = null, endDate = null) {
    if (this.storageType === "local") {
      return await this.getMealsLocal(startDate, endDate);
    } else {
      return await this.getMealsRemote(startDate, endDate);
    }
  }

  async deleteMeal(mealId) {
    if (this.storageType === "local") {
      await del(`meal_${mealId}`);
    } else {
      await this.deleteMealRemote(mealId);
    }
  }

  // Local storage methods
  async getMealsLocal(startDate, endDate) {
    const allKeys = await keys();
    const mealKeys = allKeys.filter((key) => key.startsWith("meal_"));
    const meals = [];

    for (const key of mealKeys) {
      const meal = await get(key);
      if (meal && this.isDateInRange(meal.timestamp, startDate, endDate)) {
        meals.push(meal);
      }
    }

    return meals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Remote storage methods
  async saveMealRemote(meal) {
    if (!this.apiUrl) {
      throw new Error("API URL not configured");
    }

    const response = await fetch(`${this.apiUrl}/meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(meal),
    });

    if (!response.ok) {
      throw new Error("Failed to save meal to remote storage");
    }

    return await response.json();
  }

  async getMealsRemote(startDate, endDate) {
    if (!this.apiUrl) {
      throw new Error("API URL not configured");
    }

    const params = new URLSearchParams();
    if (startDate) params.append("start", startDate);
    if (endDate) params.append("end", endDate);

    const response = await fetch(`${this.apiUrl}/meals?${params}`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch meals from remote storage");
    }

    return await response.json();
  }

  async deleteMealRemote(mealId) {
    if (!this.apiUrl) {
      throw new Error("API URL not configured");
    }

    const response = await fetch(`${this.apiUrl}/meals/${mealId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete meal from remote storage");
    }
  }

  // Data export/import
  async exportData() {
    const meals = await this.getMeals();
    return {
      meals,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
  }

  async importData(data) {
    if (!data.meals || !Array.isArray(data.meals)) {
      throw new Error("Invalid data format");
    }

    for (const meal of data.meals) {
      await this.saveMeal(meal);
    }

    return data.meals.length;
  }

  // Utility methods
  isDateInRange(dateString, startDate, endDate) {
    if (!startDate && !endDate) return true;

    const date = new Date(dateString);
    const start = startDate ? new Date(startDate) : new Date("1970-01-01");
    const end = endDate ? new Date(endDate) : new Date("2099-12-31");

    return date >= start && date <= end;
  }

  // Authentication for remote storage
  async authenticate(credentials) {
    if (!this.apiUrl) {
      throw new Error("API URL not configured");
    }

    const response = await fetch(`${this.apiUrl}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Authentication failed");
    }

    const result = await response.json();
    this.setAuthToken(result.token);
    return result;
  }

  isAuthenticated() {
    return this.storageType === "local" || !!this.authToken;
  }
}
