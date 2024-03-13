"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FilterBinding, FilterBindingProvider } from "../filter";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export interface DashboardProps {
  children?: React.ReactNode;
  bindings?: FilterBinding<any>[];
}

export function Dashboard({ children, bindings = [] }: DashboardProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <FilterBindingProvider bindings={bindings}>
        {children}
      </FilterBindingProvider>
    </QueryClientProvider>
  );
}
