"use client";

import * as React from "react";
import {
  DataGridPro,
  GridActionsCellItem,
  GridColDef,
  GridPaginationModel,
  GridRowId,
  GridSortModel,
  GridValidRowModel,
  GridValueGetterParams,
  LicenseInfo,
} from "@mui/x-data-grid-pro";
import { Box } from "@mui/material";
import { Collection, ListRows, ListRowsResult } from "./types";
import useSWR from "swr";
import DeleteIcon from "@mui/icons-material/Delete";
import invariant from "invariant";

LicenseInfo.setLicenseKey(
  "f359d9c0d105599a7d83c3f8d775eca5Tz0xMjMsRT0yNTI0NjA0NDAwMDAwLFM9cHJlbWl1bSxMTT1wZXJwZXR1YWwsS1Y9Mg=="
);

function dateValueGetter({ value }: GridValueGetterParams): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Date(value);
}

async function callList<R extends GridValidRowModel>([
  list,
  paginationModel,
  order,
]: [ListRows<R, "pages">, GridPaginationModel, GridSortModel]) {
  const data = await list({ order, ...paginationModel });
  return data;
}

const MutateContext = React.createContext<() => void>(() => {});
const DataContext = React.createContext<Collection<any> | null>(null);

interface DeleteActionProps {
  id: GridRowId;
}

function DeleteAction({ id }: DeleteActionProps) {
  const data = React.useContext(DataContext);
  const mutate = React.useContext(MutateContext);
  invariant(data, "Data context missing");

  const handleClick = React.useCallback(() => {
    data.delete?.({ id });
    mutate();
  }, [data, id, mutate]);

  return (
    <GridActionsCellItem
      icon={<DeleteIcon />}
      label="Delete"
      onClick={handleClick}
    />
  );
}

export interface MyClientDataGridProps<R extends GridValidRowModel> {
  data: Collection<R>;
  columns?: GridColDef[];
}

export default function MyClientDataGrid<R extends GridValidRowModel>({
  data,
  columns: columnsProp,
}: MyClientDataGridProps<R>) {
  const [serverSortModel, setServerSortModel] = React.useState<GridSortModel>(
    []
  );

  const [serverPaginationModel, setServerPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const {
    data: listResult,
    isLoading,
    mutate,
    error,
  } = useSWR<ListRowsResult<R>>(
    [data.list, serverPaginationModel, serverSortModel],
    callList
  );

  const listResultColumns = listResult?.columns;

  const columns: GridColDef[] = React.useMemo(() => {
    if (columnsProp) {
      return columnsProp;
    }

    const serverColumns = listResultColumns || data.columns;

    const columns: GridColDef[] = serverColumns.map(
      ({ valueProp, ...column }) => {
        const result: GridColDef = { ...column };
        if (column.type === "date" || column.type === "dateTime") {
          result.valueGetter = dateValueGetter;
        }

        if (column.editable && !data.update) {
          console.warn("Grid has editable columns, but no update method");
          delete result.editable;
        }

        if (typeof valueProp !== "undefined") {
          result.valueGetter = ({ row }) => row[valueProp];
        }

        return result;
      }
    );

    if (data.delete) {
      columns.push({
        field: "actions",
        type: "actions",
        width: 80,
        getActions: (params) => [<DeleteAction id={params.id} key="delete" />],
      });
    }

    return columns;
  }, [columnsProp, data.columns, data.delete, data.update, listResultColumns]);

  const handleProcessRowUpdate = React.useCallback(
    async (newRow: R, oldRow: R) => {
      await data.update?.({ id: newRow.id, values: newRow });
      return newRow;
    },
    [data]
  );

  const paginationMode: "server" | "client" =
    listResult?.paginationMode ?? "client";
  const sortingMode: "server" | "client" = listResult?.sortingMode ?? "client";

  const rows = listResult?.rows ?? [];

  const rowIdField = listResult?.rowIdField;

  return (
    <Box sx={{ width: "100%", height: 400, position: "relative" }}>
      <DataContext.Provider value={data}>
        <MutateContext.Provider value={mutate}>
          {error ? (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              {error.message}
            </Box>
          ) : (
            <DataGridPro<R>
              key={rowIdField}
              rows={listResult?.rows ?? []}
              loading={isLoading}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              getRowId={rowIdField ? (row) => row[rowIdField] : undefined}
              rowCount={paginationMode === "server" ? 100000 : rows.length}
              pagination
              paginationMode={paginationMode}
              paginationModel={
                paginationMode === "server" ? serverPaginationModel : undefined
              }
              onPaginationModelChange={
                paginationMode === "server"
                  ? setServerPaginationModel
                  : undefined
              }
              sortingMode={sortingMode}
              sortModel={sortingMode === "server" ? serverSortModel : undefined}
              onSortModelChange={
                sortingMode === "server" ? setServerSortModel : undefined
              }
              processRowUpdate={
                data.update ? handleProcessRowUpdate : undefined
              }
            />
          )}
        </MutateContext.Provider>
      </DataContext.Provider>
    </Box>
  );
}
