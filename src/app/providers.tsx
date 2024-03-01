"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppNavigationProvider } from "@/lib/dash/next-app";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const queryClient = new QueryClient();

interface ProviderProps {
  children?: React.ReactNode;
}

export default function Providers({ children }: ProviderProps) {
  return (
    <AppNavigationProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </LocalizationProvider>
    </AppNavigationProvider>
  );
}
