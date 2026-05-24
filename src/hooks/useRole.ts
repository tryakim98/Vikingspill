/**
 * useRole.ts
 * Custom hook for role management with localStorage persistence
 */

import { useState, useEffect } from 'react';

export type UserRole = 'teacher' | 'student' | null;

interface UseRoleReturn {
  role: UserRole;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
}

export function useRole(): UseRoleReturn {
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Laste rolle fra localStorage ved mount
  useEffect(() => {
    const savedRole = localStorage.getItem('vikingspill_role') as UserRole | null;
    if (savedRole === 'teacher' || savedRole === 'student') {
      setRoleState(savedRole);
    }
    setIsLoaded(true);
  }, []);

  // Oppdater localStorage når rolle endres
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('vikingspill_role', newRole);
    } else {
      localStorage.removeItem('vikingspill_role');
    }
  };

  const clearRole = () => {
    setRole(null);
  };

  return { role: isLoaded ? role : null, setRole, clearRole };
}
