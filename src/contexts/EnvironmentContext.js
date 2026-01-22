import { createContext } from 'react';

/**
 * EnvironmentContext provides room and device awareness throughout the app
 * Single source of truth for:
 * - Active room selection
 * - Device states aggregated by room
 * - Recent user actions
 * - Room/device filtering utilities
 */
export const EnvironmentContext = createContext(null);
