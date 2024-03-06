"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FilterFieldDef, FilterProvider } from "../filter";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export interface DashboardProps {
  children?: React.ReactNode;
  filter?: FilterFieldDef[];
}

export function Dashboard({ children, filter = [] }: DashboardProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider fields={filter}>{children}</FilterProvider>
    </QueryClientProvider>
  );
}
