"use server";

import { GridValidRowModel } from "@mui/x-data-grid-pro";
import * as React from "react";
import MyClientDataGrid from "./MyClientDataGrid";
import { Collection, ServerGridColDef } from "./types";

export interface MyDataGridProps<R extends GridValidRowModel> {
  data: Collection<R>;
  columns?: ServerGridColDef<R>[];
}

export default async function MyDataGrid<R extends GridValidRowModel>({
  data,
  columns,
}: MyDataGridProps<R>) {
  return <MyClientDataGrid<R> data={data} columns={columns} />;
}
