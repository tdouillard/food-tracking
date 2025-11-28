/**
 * Theme Toggle component for light/dark mode switching
 */

const THEME_KEY = "food-tracking-theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";
const THEME_SYSTEM = "system";

export class ThemeToggle {
  constructor() {
    this.currentTheme = this.getStoredTheme() || THEME_SYSTEM;
    this.init();
  }

  /**
   * Initialize the theme toggle
   */
  init() {
    this.applyTheme(this.currentTheme);
    this.watchSystemPreference();
  }

  /**
   * Get the stored theme preference
   * @returns {string|null}
   */
  getStoredTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  /**
   * Store the theme preference
   * @param {string} theme
   */
  storeTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Apply the theme to the document
   * @param {string} theme - 'light', 'dark', or 'system'
   */
  applyTheme(theme) {
    const body = document.body;

    // Enable smooth transitions
    body.classList.add("theme-transition");

    // Remove existing theme classes
    body.classList.remove("theme-light", "theme-dark");

    if (theme === THEME_SYSTEM) {
      // Apply theme class based on system preference for consistent styling
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      body.classList.add(prefersDark ? "theme-dark" : "theme-light");
    } else if (theme === THEME_DARK) {
      body.classList.add("theme-dark");
    } else {
      body.classList.add("theme-light");
    }

    this.currentTheme = theme;
    this.storeTheme(theme);

    // Remove transition class after animation completes
    setTimeout(() => {
      body.classList.remove("theme-transition");
    }, 400);
  }

  /**
   * Toggle between themes
   */
  toggle() {
    const themes = [THEME_LIGHT, THEME_DARK, THEME_SYSTEM];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.applyTheme(themes[nextIndex]);
  }

  /**
   * Cycle to the next theme
   * @returns {string} The new theme
   */
  cycleTheme() {
    this.toggle();
    return this.currentTheme;
  }

  /**
   * Watch for system preference changes
   */
  watchSystemPreference() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      if (this.currentTheme === THEME_SYSTEM) {
        this.applyTheme(THEME_SYSTEM);
      }
    });
  }

  /**
   * Get the current effective theme (what's actually displayed)
   * @returns {string} 'light' or 'dark'
   */
  getEffectiveTheme() {
    if (this.currentTheme === THEME_SYSTEM) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? THEME_DARK
        : THEME_LIGHT;
    }
    return this.currentTheme;
  }

  /**
   * Get the icon for the current theme
   * @returns {string} Icon emoji
   */
  getIcon() {
    switch (this.currentTheme) {
      case THEME_LIGHT:
        return "☀️";
      case THEME_DARK:
        return "🌙";
      case THEME_SYSTEM:
      default:
        return "💻";
    }
  }

  /**
   * Get the label for the current theme
   * @returns {string} Theme label
   */
  getLabel() {
    switch (this.currentTheme) {
      case THEME_LIGHT:
        return "Light";
      case THEME_DARK:
        return "Dark";
      case THEME_SYSTEM:
      default:
        return "System";
    }
  }

  /**
   * Render the theme toggle button
   * @param {Object} [options] - Options
   * @param {string} [options.id] - Button ID
   * @param {string} [options.className] - Additional CSS classes
   * @returns {string} HTML string
   */
  renderButton({ id = "theme-toggle", className = "" } = {}) {
    const classNames = ["theme-toggle-btn", className]
      .filter(Boolean)
      .join(" ");
    return `
      <button class="${classNames}" id="${id}" aria-label="Toggle theme" title="Current theme: ${this.getLabel()}">
        <span class="theme-icon">${this.getIcon()}</span>
      </button>
    `;
  }

  /**
   * Attach click handler to the toggle button
   * @param {string} [buttonId] - The button ID to attach to
   */
  attachHandler(buttonId = "theme-toggle") {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", () => {
        this.cycleTheme();
        this.updateButton(buttonId);
      });
    }
  }

  /**
   * Update the button icon and title after theme change
   * @param {string} buttonId - The button ID
   */
  updateButton(buttonId = "theme-toggle") {
    const button = document.getElementById(buttonId);
    if (button) {
      const iconSpan = button.querySelector(".theme-icon");
      if (iconSpan) {
        iconSpan.textContent = this.getIcon();
      }
      button.title = `Current theme: ${this.getLabel()}`;
    }
  }
}

// Export a singleton instance
export const themeToggle = new ThemeToggle();
