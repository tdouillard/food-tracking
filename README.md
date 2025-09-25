# 🍎 Food Tracking Web App

A comprehensive Progressive Web App (PWA) for tracking your food consumption and nutrition data. Built with modern web technologies for a fast, responsive, and offline-capable experience.

![Food Tracking App Screenshot](https://github.com/user-attachments/assets/83b792c5-262b-4b13-84f4-24b7a68a0f08)

## ✨ Features

### Core Functionality
- **🍽️ Meal Tracking**: Add complete meals with multiple products or single products with quantities
- **🔍 Product Search**: Integrated with OpenFoodFacts API for comprehensive food product database
- **📊 Statistics & Analytics**: Interactive charts showing calories, macronutrients, and consumption trends
- **📅 Time-based Filtering**: View statistics by day, week, month, year, or custom periods
- **💾 Flexible Storage**: Choose between local storage (IndexedDB) or remote SQL database storage

### User Experience
- **🎨 Clean Modern UI**: Responsive design that works on all devices
- **✅ Form Validation**: Comprehensive input validation and error handling
- **📱 PWA Support**: Install as a native app with offline functionality
- **📷 Barcode Scanning**: Quickly add products by scanning barcodes
- **📈 Data Visualization**: Interactive charts powered by Chart.js

### Data Management
- **📊 Export/Import**: CSV and JSON export/import functionality
- **🔐 Authentication**: Support for remote storage with user authentication
- **🔄 Offline Sync**: Works offline and syncs when connection is restored
- **🛡️ Privacy-First**: Local data never leaves your device unless you choose remote storage

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tdouillard/food-tracking.git
   cd food-tracking
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## 📖 Usage Guide

### Adding Your First Meal

1. **Navigate to "Add Meal"** from the main navigation
2. **Enter meal details**: Name, date, and time
3. **Search for products**: Type product names to search OpenFoodFacts database
4. **Add products**: Click on search results and specify quantities
5. **Save meal**: Review nutrition summary and save

### Viewing Statistics

1. **Go to Statistics page** to view your nutrition data
2. **Select time period**: Choose from week, month, year, or custom ranges
3. **Analyze trends**: View interactive charts for calories, macronutrients, and meal patterns
4. **Export data**: Download your data as CSV or JSON files

### Managing Settings

1. **Storage Options**: Choose between local (IndexedDB) or remote (SQL) storage
2. **Data Management**: Import/export data or clear all local data
3. **Remote Storage**: Configure API URL and authenticate for cloud sync

## 🏗️ Technical Architecture

### Frontend Stack
- **Vite**: Fast build tool and development server
- **Vanilla JavaScript**: Modern ES6+ with modular architecture
- **Chart.js**: Interactive data visualization
- **CSS3**: Modern responsive design with CSS Grid and Flexbox
- **PWA**: Service Worker for offline functionality and app installation

### Storage Options
- **Local Storage**: IndexedDB via `idb-keyval` for client-side persistence
- **Remote Storage**: RESTful API integration for cloud storage and sync

### Key Libraries
- `chart.js`: Data visualization and charts
- `date-fns`: Date manipulation and formatting
- `idb-keyval`: Simple IndexedDB wrapper for local storage

## 🔧 Development

### Project Structure
```
src/
├── components/          # UI components and pages
│   ├── App.js          # Main application component
│   ├── HomePage.js     # Dashboard and daily overview
│   ├── AddMealPage.js  # Meal creation interface
│   ├── StatsPage.js    # Statistics and analytics
│   └── SettingsPage.js # App configuration
├── services/           # Business logic and API services
│   ├── StorageService.js      # Data persistence layer
│   └── OpenFoodFactsService.js # Food database API
├── utils/              # Utility functions
│   └── Router.js       # Client-side routing
├── style.css          # Global styles
└── main.js           # Application entry point
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### API Integration

The app integrates with OpenFoodFacts API for product data:
- **Search endpoint**: `https://world.openfoodfacts.org/cgi/search.pl`
- **Product details**: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`

## 🔒 Privacy & Security

- **Local-First**: By default, all data stays on your device
- **No Tracking**: No analytics, tracking, or data collection
- **Optional Cloud Sync**: Remote storage requires explicit user setup
- **Secure Authentication**: JWT-based authentication for remote storage
- **Data Portability**: Easy export/import of all your data

## 🌐 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **PWA Features**: Supported in browsers with Service Worker support
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ for healthy eating and nutrition tracking**
