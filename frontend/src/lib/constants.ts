// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Route paths
export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  LOGIN: '/login',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  FLIGHT_BOOK: '/flight/book',
};

// User roles
export const USER_ROLES = {
  USER: 'User',
  ADMIN: 'Admin',
  AIRLINE_ADMIN: 'Airline-Admin',
};

// Flight classes
export const FLIGHT_CLASSES = {
  FIRST: 1,
  BUSINESS: 2,
  PREMIUM: 3,
  ECONOMY: 4,
};

export const FLIGHT_CLASS_NAMES = {
  [FLIGHT_CLASSES.FIRST]: 'First',
  [FLIGHT_CLASSES.BUSINESS]: 'Business',
  [FLIGHT_CLASSES.PREMIUM]: 'Premium',
  [FLIGHT_CLASSES.ECONOMY]: 'Economy',
};

// Seat status
export const SEAT_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  SELECTED: 'selected',
};

// Token configuration
export const TOKEN_CONFIG = {
  COOKIE_NAME: 'token',
  STORAGE_KEY: 'authToken',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 30, 40, 50],
};

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PATTERN: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
