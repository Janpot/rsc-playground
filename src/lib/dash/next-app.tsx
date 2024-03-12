"use client";

import * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { NavigationContext, useNavigate } from "./navigation";
import { LinearProgress } from "@mui/material";

export interface AppNavigationProviderProps {
  children?: React.ReactNode;
}

export function AppNavigationProvider({
  children,
}: AppNavigationProviderProps) {
  const router = useRouter();

  const navigate = React.useCallback(
    () => (url: string, options?: { history: "replace" | "push" }) => {
      if (options?.history === "replace") {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router],
  );

  const useNavigate = React.useCallback(() => navigate(), [navigate]);

  const navigation = React.useMemo(() => {
    return {
      useNavigate,
      usePathname,
      useSearchParams,
    };
  }, [useNavigate]);

  return (
    <React.Suspense fallback={<LinearProgress />}>
      <NavigationContext.Provider value={navigation}>
        {children}
      </NavigationContext.Provider>
    </React.Suspense>
  );
}
