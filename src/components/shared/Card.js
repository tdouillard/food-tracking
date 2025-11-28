/**
 * Reusable Card component to avoid repeated card HTML markup
 */
export class Card {
  /**
   * Render a card component
   * @param {Object} options - Card options
   * @param {string} [options.title] - Optional card title
   * @param {string} [options.id] - Optional card ID
   * @param {string} [options.className] - Additional CSS classes
   * @param {string} [options.content] - Inner HTML content
   * @returns {string} HTML string for the card
   */
  static render({ title = "", id = "", className = "", content = "" } = {}) {
    const idAttr = id ? `id="${id}"` : "";
    const classNames = ["card", className].filter(Boolean).join(" ");

    return `
      <div class="${classNames}" ${idAttr}>
        ${title ? `<h2>${title}</h2>` : ""}
        ${content}
      </div>
    `;
  }

  /**
   * Create a card element programmatically
   * @param {Object} options - Card options
   * @param {string} [options.title] - Optional card title
   * @param {string} [options.id] - Optional card ID
   * @param {string} [options.className] - Additional CSS classes
   * @returns {HTMLElement} Card DOM element
   */
  static createElement({ title = "", id = "", className = "" } = {}) {
    const card = document.createElement("div");
    card.className = ["card", className].filter(Boolean).join(" ");
    if (id) card.id = id;
    if (title) {
      const h2 = document.createElement("h2");
      h2.textContent = title;
      card.appendChild(h2);
    }
    return card;
  }
}
