export class OpenFoodFactsService {
  constructor() {
    this.baseUrl = 'https://world.openfoodfacts.org';
  }

  async searchProducts(query, page = 1, pageSize = 20) {
    try {
      const url = `${this.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      
      return {
        products: data.products.map(product => this.normalizeProduct(product)),
        count: data.count,
        page: data.page,
        pageCount: data.page_count,
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return { products: [], count: 0, page: 1, pageCount: 1 };
    }
  }

  async getProductByBarcode(barcode) {
    try {
      const url = `${this.baseUrl}/api/v0/product/${barcode}.json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();
      
      if (data.status === 0) {
        throw new Error('Product not found');
      }

      return this.normalizeProduct(data.product);
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      throw error;
    }
  }

  normalizeProduct(product) {
    const nutriments = product.nutriments || {};
    
    return {
      id: product._id || product.code,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || '',
      quantity: product.quantity || '',
      imageUrl: product.image_url || product.image_front_url || '',
      categories: product.categories || '',
      nutrition: {
        energy: this.getNutrientPer100g(nutriments, 'energy-kcal') || 0,
        proteins: this.getNutrientPer100g(nutriments, 'proteins') || 0,
        carbohydrates: this.getNutrientPer100g(nutriments, 'carbohydrates') || 0,
        sugars: this.getNutrientPer100g(nutriments, 'sugars') || 0,
        fat: this.getNutrientPer100g(nutriments, 'fat') || 0,
        saturatedFat: this.getNutrientPer100g(nutriments, 'saturated-fat') || 0,
        fiber: this.getNutrientPer100g(nutriments, 'fiber') || 0,
        sodium: this.getNutrientPer100g(nutriments, 'sodium') || 0,
        salt: this.getNutrientPer100g(nutriments, 'salt') || 0,
      },
      nutritionGrade: product.nutrition_grade_fr || product.nutriscore_grade || '',
      servingSize: product.serving_size || '100g',
      barcode: product.code,
    };
  }

  getNutrientPer100g(nutriments, key) {
    // Try different variations of the key
    const variations = [
      `${key}_100g`,
      `${key}-100g`,
      `${key}_per_100g`,
      key
    ];

    for (const variation of variations) {
      if (nutriments[variation] !== undefined && nutriments[variation] !== null) {
        return parseFloat(nutriments[variation]) || 0;
      }
    }

    return 0;
  }

  async getSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const result = await this.searchProducts(query, 1, 10);
      return result.products.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  calculateNutritionForQuantity(product, quantity) {
    const quantityInGrams = this.parseQuantity(quantity);
    const factor = quantityInGrams / 100; // OpenFoodFacts provides nutrition per 100g

    return {
      energy: Math.round(product.nutrition.energy * factor * 100) / 100,
      proteins: Math.round(product.nutrition.proteins * factor * 100) / 100,
      carbohydrates: Math.round(product.nutrition.carbohydrates * factor * 100) / 100,
      sugars: Math.round(product.nutrition.sugars * factor * 100) / 100,
      fat: Math.round(product.nutrition.fat * factor * 100) / 100,
      saturatedFat: Math.round(product.nutrition.saturatedFat * factor * 100) / 100,
      fiber: Math.round(product.nutrition.fiber * factor * 100) / 100,
      sodium: Math.round(product.nutrition.sodium * factor * 100) / 100,
      salt: Math.round(product.nutrition.salt * factor * 100) / 100,
    };
  }

  parseQuantity(quantityStr) {
    // Parse quantity strings like "100g", "1.5kg", "250ml", etc.
    const match = quantityStr.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb)?/i);
    
    if (!match) {
      return 100; // Default to 100g if can't parse
    }

    let value = parseFloat(match[1]);
    const unit = (match[2] || 'g').toLowerCase();

    // Convert to grams (approximate for liquids)
    switch (unit) {
      case 'kg':
        value *= 1000;
        break;
      case 'ml':
      case 'l':
        // Approximate conversion (1ml ≈ 1g for most foods)
        if (unit === 'l') value *= 1000;
        break;
      case 'oz':
        value *= 28.35;
        break;
      case 'lb':
        value *= 453.59;
        break;
      default:
        // 'g' or unknown units, keep as is
        break;
    }

    return value;
  }
}