import { StorageService } from "../../services/StorageService.js";
import { Chart, registerables } from "chart.js";
import template from "./StatsPage.html?raw";
import "./StatsPage.css";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  eachDayOfInterval,
} from "date-fns";

// Register Chart.js components
Chart.register(...registerables);

export class StatsPage {
  constructor() {
    this.storageService = new StorageService();
    this.currentFilter = "week";
    this.charts = {};
  }

  async render(container) {
    container.innerHTML = template;
    await this.loadStats();
    this.attachEventListeners(container);
  }

  attachEventListeners(container) {
    container
      .querySelector("#time-filter")
      .addEventListener("change", async (e) => {
        this.currentFilter = e.target.value;
        await this.loadStats();
      });

    container.querySelector("#export-csv").addEventListener("click", () => {
      this.exportDataAsCSV();
    });

    container.querySelector("#export-json").addEventListener("click", () => {
      this.exportDataAsJSON();
    });
  }

  async loadStats() {
    const loadingDiv = document.getElementById("loading");
    const contentDiv = document.getElementById("stats-content");

    loadingDiv.classList.remove("hidden");
    contentDiv.classList.add("hidden");

    try {
      const { startDate, endDate } = this.getDateRange();
      const meals = await this.storageService.getMeals(
        startDate.toISOString(),
        endDate.toISOString(),
      );

      this.renderSummaryStats(meals);
      this.renderCaloriesChart(meals);
      this.renderMacrosChart(meals);
      this.renderNutritionTrendChart(meals);
      this.renderMealDistributionChart(meals);

      loadingDiv.classList.add("hidden");
      contentDiv.classList.remove("hidden");
    } catch (error) {
      loadingDiv.innerHTML = `
        <div class="alert alert-error">
          <strong>Error:</strong> Failed to load statistics. ${error.message}
        </div>
      `;
    }
  }

  getDateRange() {
    const now = new Date();

    switch (this.currentFilter) {
      case "week":
        return { startDate: startOfWeek(now), endDate: endOfWeek(now) };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case "year":
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case "30days":
        return { startDate: subDays(now, 30), endDate: now };
      case "90days":
        return { startDate: subDays(now, 90), endDate: now };
      default:
        return { startDate: startOfWeek(now), endDate: endOfWeek(now) };
    }
  }

  renderSummaryStats(meals) {
    const totalNutrition = this.calculateTotalNutrition(meals);
    const avgCaloriesPerDay = this.calculateAverageCaloriesPerDay(meals);
    const totalMeals = meals.length;
    const avgMealsPerDay = this.calculateAverageMealsPerDay(meals);

    document.getElementById("summary-stats").innerHTML = `
      <div class="stat-card">
        <div class="stat-number">${totalMeals}</div>
        <div class="stat-label">Total Meals</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Math.round(avgCaloriesPerDay)}</div>
        <div class="stat-label">Avg Calories/Day</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${avgMealsPerDay.toFixed(1)}</div>
        <div class="stat-label">Avg Meals/Day</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Math.round(totalNutrition.proteins)}</div>
        <div class="stat-label">Total Proteins (g)</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Math.round(totalNutrition.carbohydrates)}</div>
        <div class="stat-label">Total Carbs (g)</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Math.round(totalNutrition.fat)}</div>
        <div class="stat-label">Total Fats (g)</div>
      </div>
    `;
  }

  renderCaloriesChart(meals) {
    const dailyCalories = this.groupMealsByDay(meals);
    const { startDate, endDate } = this.getDateRange();
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const data = dateRange.map((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayMeals = dailyCalories[dateKey] || [];
      return dayMeals.reduce(
        (total, meal) => total + (meal.totalNutrition?.energy || 0),
        0,
      );
    });

    const ctx = document.getElementById("calories-chart").getContext("2d");

    if (this.charts.calories) {
      this.charts.calories.destroy();
    }

    this.charts.calories = new Chart(ctx, {
      type: "line",
      data: {
        labels: dateRange.map((date) => format(date, "MMM dd")),
        datasets: [
          {
            label: "Daily Calories",
            data: data,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Calories",
            },
          },
        },
      },
    });
  }

  renderMacrosChart(meals) {
    const totalNutrition = this.calculateTotalNutrition(meals);

    const ctx = document.getElementById("macros-chart").getContext("2d");

    if (this.charts.macros) {
      this.charts.macros.destroy();
    }

    // Calculate calories from macronutrients
    const proteinCalories = totalNutrition.proteins * 4;
    const carbCalories = totalNutrition.carbohydrates * 4;
    const fatCalories = totalNutrition.fat * 9;

    this.charts.macros = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Proteins", "Carbohydrates", "Fats"],
        datasets: [
          {
            data: [proteinCalories, carbCalories, fatCalories],
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed * 100) / total).toFixed(1);
                return `${context.label}: ${Math.round(context.parsed)} cal (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  renderNutritionTrendChart(meals) {
    const dailyNutrition = this.groupMealsByDay(meals);
    const { startDate, endDate } = this.getDateRange();
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const proteinsData = [];
    const carbsData = [];
    const fatsData = [];

    dateRange.forEach((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayMeals = dailyNutrition[dateKey] || [];
      const dayTotals = this.calculateTotalNutrition(dayMeals);

      proteinsData.push(dayTotals.proteins);
      carbsData.push(dayTotals.carbohydrates);
      fatsData.push(dayTotals.fat);
    });

    const ctx = document
      .getElementById("nutrition-trend-chart")
      .getContext("2d");

    if (this.charts.nutritionTrend) {
      this.charts.nutritionTrend.destroy();
    }

    this.charts.nutritionTrend = new Chart(ctx, {
      type: "line",
      data: {
        labels: dateRange.map((date) => format(date, "MMM dd")),
        datasets: [
          {
            label: "Proteins (g)",
            data: proteinsData,
            borderColor: "#FF6384",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
          },
          {
            label: "Carbs (g)",
            data: carbsData,
            borderColor: "#36A2EB",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
          },
          {
            label: "Fats (g)",
            data: fatsData,
            borderColor: "#FFCE56",
            backgroundColor: "rgba(255, 206, 86, 0.1)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Grams",
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  renderMealDistributionChart(meals) {
    const mealTypes = {};

    meals.forEach((meal) => {
      const hour = new Date(meal.timestamp).getHours();
      let mealType;

      if (hour >= 5 && hour < 11) mealType = "Breakfast";
      else if (hour >= 11 && hour < 17) mealType = "Lunch";
      else if (hour >= 17 && hour < 22) mealType = "Dinner";
      else mealType = "Snacks";

      mealTypes[mealType] = (mealTypes[mealType] || 0) + 1;
    });

    const ctx = document
      .getElementById("meal-distribution-chart")
      .getContext("2d");

    if (this.charts.mealDistribution) {
      this.charts.mealDistribution.destroy();
    }

    this.charts.mealDistribution = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(mealTypes),
        datasets: [
          {
            label: "Number of Meals",
            data: Object.values(mealTypes),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  // Utility methods
  calculateTotalNutrition(meals) {
    return meals.reduce(
      (total, meal) => {
        const mealNutrition = meal.totalNutrition || {};
        return {
          energy: total.energy + (mealNutrition.energy || 0),
          proteins: total.proteins + (mealNutrition.proteins || 0),
          carbohydrates:
            total.carbohydrates + (mealNutrition.carbohydrates || 0),
          fat: total.fat + (mealNutrition.fat || 0),
          sugars: total.sugars + (mealNutrition.sugars || 0),
          saturatedFat: total.saturatedFat + (mealNutrition.saturatedFat || 0),
          fiber: total.fiber + (mealNutrition.fiber || 0),
          sodium: total.sodium + (mealNutrition.sodium || 0),
          salt: total.salt + (mealNutrition.salt || 0),
        };
      },
      {
        energy: 0,
        proteins: 0,
        carbohydrates: 0,
        fat: 0,
        sugars: 0,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
        salt: 0,
      },
    );
  }

  groupMealsByDay(meals) {
    const grouped = {};
    meals.forEach((meal) => {
      const dateKey = format(new Date(meal.timestamp), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(meal);
    });
    return grouped;
  }

  calculateAverageCaloriesPerDay(meals) {
    const dailyCalories = this.groupMealsByDay(meals);
    const days = Object.keys(dailyCalories).length;

    if (days === 0) return 0;

    const totalCalories = Object.values(dailyCalories).reduce(
      (total, dayMeals) => {
        const dayCalories = dayMeals.reduce(
          (dayTotal, meal) => dayTotal + (meal.totalNutrition?.energy || 0),
          0,
        );
        return total + dayCalories;
      },
      0,
    );

    return totalCalories / days;
  }

  calculateAverageMealsPerDay(meals) {
    const { startDate, endDate } = this.getDateRange();
    const totalDays =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    return meals.length / totalDays;
  }

  async exportDataAsCSV() {
    try {
      const { startDate, endDate } = this.getDateRange();
      const meals = await this.storageService.getMeals(
        startDate.toISOString(),
        endDate.toISOString(),
      );

      const csvContent = this.convertMealsToCSV(meals);
      this.downloadFile(
        csvContent,
        `food-tracking-${this.currentFilter}.csv`,
        "text/csv",
      );
    } catch (error) {
      alert("Export failed: " + error.message);
    }
  }

  async exportDataAsJSON() {
    try {
      const data = await this.storageService.exportData();
      const jsonContent = JSON.stringify(data, null, 2);
      this.downloadFile(
        jsonContent,
        `food-tracking-${format(new Date(), "yyyy-MM-dd")}.json`,
        "application/json",
      );
    } catch (error) {
      alert("Export failed: " + error.message);
    }
  }

  convertMealsToCSV(meals) {
    const headers = [
      "Date",
      "Time",
      "Meal Name",
      "Product Name",
      "Quantity",
      "Calories",
      "Proteins",
      "Carbohydrates",
      "Fat",
      "Sugars",
      "Fiber",
    ];

    const rows = [];

    meals.forEach((meal) => {
      const date = format(new Date(meal.timestamp), "yyyy-MM-dd");
      const time = format(new Date(meal.timestamp), "HH:mm");

      if (meal.products && meal.products.length > 0) {
        meal.products.forEach((product) => {
          const nutrition = product.calculatedNutrition || {};
          rows.push([
            date,
            time,
            meal.name,
            product.name,
            product.quantity,
            Math.round(nutrition.energy || 0),
            Math.round(nutrition.proteins || 0),
            Math.round(nutrition.carbohydrates || 0),
            Math.round(nutrition.fat || 0),
            Math.round(nutrition.sugars || 0),
            Math.round(nutrition.fiber || 0),
          ]);
        });
      } else {
        // Meal without products
        const nutrition = meal.totalNutrition || {};
        rows.push([
          date,
          time,
          meal.name,
          "",
          "",
          Math.round(nutrition.energy || 0),
          Math.round(nutrition.proteins || 0),
          Math.round(nutrition.carbohydrates || 0),
          Math.round(nutrition.fat || 0),
          Math.round(nutrition.sugars || 0),
          Math.round(nutrition.fiber || 0),
        ]);
      }
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    return csvContent;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
