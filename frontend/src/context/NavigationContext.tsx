import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface NavigationState {
  currentPage: string;
  portalState: Record<string, any>; // For storing portal-specific state like active tab, filters, etc.
}

interface NavigationContextType {
  navigationState: NavigationState;
  setCurrentPage: (page: string) => void;
  setPortalState: (portal: string, state: any) => void;
  getPortalState: (portal: string) => any;
  clearPortalState: (portal: string) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const NAVIGATION_STORAGE_KEY = 'app_navigation_state';
const PORTAL_STATE_PREFIX = 'portal_state_';

function areStatesEqual(left: any, right: any): boolean {
  if (left === right) return true;

  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Try to restore state from localStorage
    try {
      const stored = localStorage.getItem(NAVIGATION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to restore navigation state:', error);
    }
    return { currentPage: 'dashboard', portalState: {} };
  });

  // Save navigation state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(navigationState));
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }, [navigationState]);

  const setCurrentPage = useCallback((page: string) => {
    setNavigationState(prev => {
      if (prev.currentPage === page) {
        return prev;
      }

      return {
        ...prev,
        currentPage: page
      };
    });
  }, []);

  const setPortalState = useCallback((portal: string, state: any) => {
    setNavigationState(prev => {
      const currentPortalState = prev.portalState[portal];
      if (areStatesEqual(currentPortalState, state)) {
        return prev;
      }

      return {
        ...prev,
        portalState: {
          ...prev.portalState,
          [portal]: state
        }
      };
    });
    
    // Also save portal-specific state to localStorage for persistence
    try {
      const storageKey = `${PORTAL_STATE_PREFIX}${portal}`;
      const serializedState = JSON.stringify(state);
      if (localStorage.getItem(storageKey) !== serializedState) {
        localStorage.setItem(storageKey, serializedState);
      }
    } catch (error) {
      console.error(`Failed to save portal state for ${portal}:`, error);
    }
  }, []);

  const getPortalState = useCallback((portal: string) => {
    // Try to get from context first, then from localStorage
    if (navigationState.portalState[portal]) {
      return navigationState.portalState[portal];
    }
    
    try {
      const stored = localStorage.getItem(`${PORTAL_STATE_PREFIX}${portal}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(`Failed to restore portal state for ${portal}:`, error);
    }
    
    return null;
  }, [navigationState.portalState]);

  const clearPortalState = useCallback((portal: string) => {
    setNavigationState(prev => {
      if (!(portal in prev.portalState) || prev.portalState[portal] === undefined) {
        return prev;
      }

      return {
        ...prev,
        portalState: {
          ...prev.portalState,
          [portal]: undefined
        }
      };
    });
    
    try {
      localStorage.removeItem(`${PORTAL_STATE_PREFIX}${portal}`);
    } catch (error) {
      console.error(`Failed to clear portal state for ${portal}:`, error);
    }
  }, []);

  return (
    <NavigationContext.Provider value={{
      navigationState,
      setCurrentPage,
      setPortalState,
      getPortalState,
      clearPortalState
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
