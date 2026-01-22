import { useContext } from 'react';
import { EnvironmentContext } from '../contexts/EnvironmentContext.js';

/**
 * Hook to access environment context
 * Provides room and device awareness throughout the app
 */
export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within EnvironmentProvider');
  }
  return context;
};
