"use client";
import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";

type NavigationLockContextType = {
  isLocked: boolean;
  toggle: () => void;
  setLocked: (v: boolean) => void;
};

const NavigationLockContext = createContext<NavigationLockContextType | null>(null);

export function NavigationLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setLocked] = useState(false);
  const toggle = useCallback(() => setLocked(v => !v), []);
  const value = useMemo(() => ({ isLocked, toggle, setLocked }), [isLocked, toggle]);
  return <NavigationLockContext.Provider value={value}>{children}</NavigationLockContext.Provider>;
}

export function useNavigationLock() {
  const ctx = useContext(NavigationLockContext);
  if (!ctx) throw new Error("useNavigationLock must be used within NavigationLockProvider");
  return ctx;
}
