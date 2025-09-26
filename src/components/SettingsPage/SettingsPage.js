import { StorageService } from "../../services/StorageService.js";
import template from "./SettingsPage.html?raw";
import "./SettingsPage.css";

export class SettingsPage {
  constructor() {
    this.storageService = new StorageService();
  }

  async render(container) {
    container.innerHTML = template;
    await this.loadCurrentSettings();
    this.attachEventListeners(container);
    await this.updateStats();
  }

  async loadCurrentSettings() {
    // Load current storage type
    const storageType = this.storageService.storageType;
    document.getElementById("storage-type").value = storageType;
    document.getElementById("current-storage-type").textContent =
      storageType === "local" ? "Local (IndexedDB)" : "Remote (SQL)";

    // Show/hide remote settings
    if (storageType === "remote") {
      document.getElementById("remote-settings").classList.remove("hidden");
      document.getElementById("api-url").value =
        this.storageService.apiUrl || "";
      await this.updateAuthStatus();
    }
  }

  async updateAuthStatus() {
    const authStatus = document.getElementById("auth-status");
    const authForm = document.getElementById("auth-form");
    const logoutBtn = document.getElementById("logout-btn");

    if (
      this.storageService.isAuthenticated() &&
      this.storageService.storageType === "remote"
    ) {
      authStatus.innerHTML =
        '<div class="alert alert-success">✅ Authenticated and connected to remote storage</div>';
      authForm.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
    } else {
      authStatus.innerHTML =
        '<div class="alert alert-warning">⚠️ Not authenticated. Please login to use remote storage.</div>';
      authForm.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }
  }

  attachEventListeners(container) {
    // Storage type change
    container.querySelector("#storage-type").addEventListener("change", (e) => {
      const isRemote = e.target.value === "remote";
      const remoteSettings = container.querySelector("#remote-settings");

      if (isRemote) {
        remoteSettings.classList.remove("hidden");
      } else {
        remoteSettings.classList.add("hidden");
      }
    });

    // Save storage settings
    container
      .querySelector("#save-storage-settings")
      .addEventListener("click", async () => {
        await this.saveStorageSettings();
      });

    // Authentication
    container
      .querySelector("#login-btn")
      .addEventListener("click", async () => {
        await this.handleLogin();
      });

    container
      .querySelector("#register-btn")
      .addEventListener("click", async () => {
        await this.handleRegister();
      });

    container.querySelector("#logout-btn").addEventListener("click", () => {
      this.handleLogout();
    });

    // Data management
    container.querySelector("#import-file").addEventListener("change", (e) => {
      const importBtn = container.querySelector("#import-data");
      importBtn.disabled = !e.target.files.length;
    });

    container
      .querySelector("#import-data")
      .addEventListener("click", async () => {
        await this.handleImportData();
      });

    container
      .querySelector("#export-all-json")
      .addEventListener("click", async () => {
        await this.handleExportData();
      });

    container
      .querySelector("#clear-all-data")
      .addEventListener("click", async () => {
        await this.handleClearAllData();
      });
  }

  async saveStorageSettings() {
    const storageType = document.getElementById("storage-type").value;
    const apiUrl = document.getElementById("api-url").value.trim();

    try {
      this.storageService.setStorageType(storageType);

      if (storageType === "remote" && apiUrl) {
        this.storageService.setApiUrl(apiUrl);
      }

      document.getElementById("current-storage-type").textContent =
        storageType === "local" ? "Local (IndexedDB)" : "Remote (SQL)";

      this.showAlert("Storage settings saved successfully!", "success");

      if (storageType === "remote") {
        await this.updateAuthStatus();
      }
    } catch (error) {
      this.showAlert("Failed to save settings: " + error.message, "error");
    }
  }

  async handleLogin() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      this.showAlert("Please enter both email and password.", "error");
      return;
    }

    try {
      await this.storageService.authenticate({ email, password });
      await this.updateAuthStatus();
      this.showAlert("Successfully logged in!", "success");

      // Clear password field
      document.getElementById("password").value = "";
    } catch (error) {
      this.showAlert("Login failed: " + error.message, "error");
    }
  }

  async handleRegister() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      this.showAlert("Please enter both email and password.", "error");
      return;
    }

    try {
      // For demo purposes, show message about registration
      this.showAlert(
        "Registration functionality would connect to your API server. For now, use login with existing credentials.",
        "warning",
      );
    } catch (error) {
      this.showAlert("Registration failed: " + error.message, "error");
    }
  }

  handleLogout() {
    this.storageService.setAuthToken("");
    this.updateAuthStatus();
    this.showAlert("Successfully logged out.", "success");
  }

  async handleImportData() {
    const fileInput = document.getElementById("import-file");
    const file = fileInput.files[0];

    if (!file) {
      this.showAlert("Please select a file to import.", "error");
      return;
    }

    try {
      const fileContent = await this.readFileContent(file);
      let data;

      if (file.name.endsWith(".json")) {
        data = JSON.parse(fileContent);
      } else if (file.name.endsWith(".csv")) {
        data = this.parseCSVData(fileContent);
      } else {
        throw new Error("Unsupported file format. Please use JSON or CSV.");
      }

      const importedCount = await this.storageService.importData(data);
      this.showAlert(
        `Successfully imported ${importedCount} meals!`,
        "success",
      );

      // Update stats
      await this.updateStats();

      // Clear file input
      fileInput.value = "";
      document.getElementById("import-data").disabled = true;
    } catch (error) {
      this.showAlert("Import failed: " + error.message, "error");
    }
  }

  async handleExportData() {
    try {
      const data = await this.storageService.exportData();
      const jsonContent = JSON.stringify(data, null, 2);

      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `food-tracking-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      this.showAlert("Data exported successfully!", "success");
    } catch (error) {
      this.showAlert("Export failed: " + error.message, "error");
    }
  }

  async handleClearAllData() {
    const confirmation = prompt(
      'This will delete ALL your local data. Type "DELETE" to confirm:',
    );

    if (confirmation !== "DELETE") {
      this.showAlert("Data deletion cancelled.", "warning");
      return;
    }

    try {
      // Get all meals and delete them
      const meals = await this.storageService.getMeals();

      for (const meal of meals) {
        await this.storageService.deleteMeal(meal.id);
      }

      await this.updateStats();
      this.showAlert(`Successfully deleted ${meals.length} meals.`, "success");
    } catch (error) {
      this.showAlert("Failed to clear data: " + error.message, "error");
    }
  }

  async updateStats() {
    try {
      const meals = await this.storageService.getMeals();
      document.getElementById("total-meals").textContent = meals.length;

      // Estimate data size
      const dataSize = new Blob([JSON.stringify(meals)]).size;
      const sizeInKB = (dataSize / 1024).toFixed(1);
      document.getElementById("data-size").textContent = `${sizeInKB} KB`;
    } catch (error) {
      document.getElementById("total-meals").textContent = "Error loading";
      document.getElementById("data-size").textContent = "Unknown";
    }
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  parseCSVData(csvContent) {
    // Simple CSV parser for meals data
    const lines = csvContent.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

    const meals = [];
    const mealGroups = {};

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim());
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      // Group by date, time, and meal name
      const mealKey = `${row.Date}_${row.Time}_${row["Meal Name"]}`;

      if (!mealGroups[mealKey]) {
        mealGroups[mealKey] = {
          name: row["Meal Name"] || "Imported Meal",
          timestamp: new Date(`${row.Date}T${row.Time}`).toISOString(),
          products: [],
        };
      }

      if (row["Product Name"]) {
        mealGroups[mealKey].products.push({
          name: row["Product Name"],
          quantity: row.Quantity || "100g",
          calculatedNutrition: {
            energy: parseFloat(row.Calories) || 0,
            proteins: parseFloat(row.Proteins) || 0,
            carbohydrates: parseFloat(row.Carbohydrates) || 0,
            fat: parseFloat(row.Fat) || 0,
            sugars: parseFloat(row.Sugars) || 0,
            fiber: parseFloat(row.Fiber) || 0,
          },
        });
      }
    }

    // Calculate total nutrition for each meal
    Object.values(mealGroups).forEach((meal) => {
      meal.totalNutrition = meal.products.reduce(
        (total, product) => ({
          energy: total.energy + (product.calculatedNutrition.energy || 0),
          proteins:
            total.proteins + (product.calculatedNutrition.proteins || 0),
          carbohydrates:
            total.carbohydrates +
            (product.calculatedNutrition.carbohydrates || 0),
          fat: total.fat + (product.calculatedNutrition.fat || 0),
          sugars: total.sugars + (product.calculatedNutrition.sugars || 0),
          fiber: total.fiber + (product.calculatedNutrition.fiber || 0),
        }),
        {
          energy: 0,
          proteins: 0,
          carbohydrates: 0,
          fat: 0,
          sugars: 0,
          fiber: 0,
        },
      );

      meals.push(meal);
    });

    return { meals };
  }

  showAlert(message, type) {
    const alertContainer = document.getElementById("alert-container");
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  }
}
