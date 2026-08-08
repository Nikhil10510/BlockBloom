/**
 * Centralized API Base Configuration
 *
 * Ensures all API calls point to the active backend instance (blockbloom.onrender.com)
 * even if VITE_API_BASE environment variable contains the legacy blockbloom-1 URL.
 */
const rawApiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
export const API_BASE = rawApiBase.replace('blockbloom-1.onrender.com', 'blockbloom.onrender.com');
