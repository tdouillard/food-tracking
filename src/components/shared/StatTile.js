/**
 * Reusable StatTile component for displaying statistics with icons
 */

// Icon mappings for common stat types
const STAT_ICONS = {
  calories: "🔥",
  energy: "🔥",
  proteins: "🥩",
  protein: "🥩",
  carbs: "🍞",
  carbohydrates: "🍞",
  fats: "🧈",
  fat: "🧈",
  sugars: "🍬",
  sugar: "🍬",
  fiber: "🌾",
  meals: "🍽️",
  "total meals": "🍽️",
  "avg meals/day": "📅",
  "avg calories/day": "📊",
  sodium: "🧂",
  salt: "🧂",
};

export class StatTile {
  /**
   * Render a stat tile component
   * @param {Object} options - StatTile options
   * @param {string|number} options.value - The stat value to display
   * @param {string} options.label - The stat label
   * @param {string} [options.icon] - Optional custom icon (emoji or SVG)
   * @param {boolean} [options.showIcon=true] - Whether to show an icon
   * @param {string} [options.id] - Optional tile ID
   * @param {string} [options.className] - Additional CSS classes
   * @returns {string} HTML string for the stat tile
   */
  static render({
    value,
    label,
    icon = null,
    showIcon = true,
    id = "",
    className = "",
  } = {}) {
    const idAttr = id ? `id="${id}"` : "";
    const classNames = ["stat-card", className].filter(Boolean).join(" ");

    // Determine icon to use
    const displayIcon =
      showIcon && (icon || StatTile.getIconForLabel(label))
        ? `<span class="stat-icon">${icon || StatTile.getIconForLabel(label)}</span>`
        : "";

    return `
      <div class="${classNames}" ${idAttr}>
        ${displayIcon}
        <div class="stat-number">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    `;
  }

  /**
   * Get the appropriate icon for a stat label
   * @param {string} label - The stat label
   * @returns {string|null} The icon emoji or null
   */
  static getIconForLabel(label) {
    // Normalize label by converting to lowercase and removing special characters
    const normalizedLabel = label.toLowerCase().replace(/[()\/]/g, "").trim();
    return STAT_ICONS[normalizedLabel] || null;
  }

  /**
   * Render a grid of stat tiles
   * @param {Array} stats - Array of stat objects {value, label, icon?, showIcon?}
   * @param {Object} [options] - Grid options
   * @param {string} [options.className] - Additional CSS classes for the grid
   * @returns {string} HTML string for the stat grid
   */
  static renderGrid(stats, { className = "" } = {}) {
    const gridClass = ["stat-grid", className].filter(Boolean).join(" ");
    return `
      <div class="${gridClass}">
        ${stats.map((stat) => StatTile.render(stat)).join("")}
      </div>
    `;
  }

  /**
   * Common stat tile configurations
   */
  static nutritionTiles(nutrition) {
    return [
      { value: Math.round(nutrition.energy || 0), label: "Calories" },
      { value: `${Math.round(nutrition.proteins || 0)}g`, label: "Proteins" },
      {
        value: `${Math.round(nutrition.carbohydrates || 0)}g`,
        label: "Carbs",
      },
      { value: `${Math.round(nutrition.fat || 0)}g`, label: "Fats" },
    ];
  }

  static extendedNutritionTiles(nutrition) {
    return [
      ...StatTile.nutritionTiles(nutrition),
      { value: `${Math.round(nutrition.sugars || 0)}g`, label: "Sugars" },
      { value: `${Math.round(nutrition.fiber || 0)}g`, label: "Fiber" },
    ];
  }
}
