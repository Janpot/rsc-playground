"use server";

import { GridValidRowModel } from "@mui/x-data-grid-pro";
import * as React from "react";
import ClientDataGrid from "./ClientDataGrid";
import { DataSource, ServerGridColDef } from "../types";

export interface DataGridProps<R extends GridValidRowModel> {
  data: DataSource<R>;
  columns?: ServerGridColDef<R>[];
}

export default async function DataGrid<R extends GridValidRowModel>({
  data,
  columns,
}: DataGridProps<R>) {
  return <ClientDataGrid<R> data={data} columns={columns} />;
}
