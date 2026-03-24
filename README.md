# Run And Eat - Mobile App (Frontend)

A modern, high-performance fitness and nutrition dashboard built with Expo and React Native. Designed to help users track their physical activities and daily intake with ease and elegance.

## 🚀 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 51+)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **API Client**: [Axios](https://axios-http.com/) with robust Interceptors
- **Charts**: Custom SVG implementation using `react-native-svg`
- **Forms**: `react-hook-form` + `zod` validation
- **Storage**: `expo-secure-store` for sensitive token management

## ✨ Key Features

- **Dynamic Dashboard**: Interactive charts showing 7-day trends for calories and distance.
- **Unified Activity History**: Grouped activity logs with daily summaries and smart filtering.
- **Robust Auth Flow**: Seamless Login/Register with hardware-encrypted token storage and automated background refresh.
- **Activity Logging**: Intuitive forms for quick entry of running sessions and meals.
- **Modern UI**: Premium, card-based design with micro-animations and smooth transitions.

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configuration
Update the API base URL in `constants/Config.ts` to match your local backend IP.

### 3. Running the App
```bash
# Start the Expo development server
npx expo start

# Start and clear cache (recommended after branding changes)
npx expo start -c
```

## 📱 Features Breakdown

### Dashboard
Real-time visualization of your progress toward goals. Uses custom SVG components for high performance and stability on mobile devices.

### History
A centralized log of all your actions. Filter by category (Running/Meals) or date range to see your performance over time.

### Secure Auth
Implementation of the Refresh Token flow with request queuing, ensuring no session drops even during multiple concurrent API calls.

## 📂 Structure
- `app/`: Routing and main screens.
- `api/`: Service layer for backend communication.
- `components/`: Reusable UI components (Charts, Cards, Form Fields).
- `store/`: Zustand stores for global state (Auth, User Profile).
- `types/`: Comprehensive TypeScript definitions.

## 🎨 Design System
- **Colors**: Vibrant, fitness-oriented palette.
- **Typography**: Clean, modern sans-serif.
- **Icons**: Lucide & Ionicons via `@expo/vector-icons`.
