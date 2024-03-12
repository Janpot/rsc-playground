"use client";

import * as React from "react";
import {
  DataGridPro,
  GridActionsCellItem,
  GridColDef,
  GridPaginationModel,
  GridRowId,
  GridRowModel,
  GridSortModel,
  GridValidRowModel,
  GridValueGetterParams,
} from "@mui/x-data-grid-pro";
import { Box } from "@mui/material";
import {
  DataSource,
  GetRows,
  ListRowsResult,
  PaginationMode,
  PaginationModel,
} from "../types";
import useSWR from "swr";
import DeleteIcon from "@mui/icons-material/Delete";
import invariant from "invariant";

function dateValueGetter({ value }: GridValueGetterParams): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Date(value);
}

async function callGetRows<R extends GridValidRowModel>([
  list,
  paginationModel,
  order,
]: [GetRows<R, "pages">, GridPaginationModel, GridSortModel]) {
  const data = await list({
    sortModel: order,
    paginationModel: {
      pageSize: paginationModel.pageSize,
      start: paginationModel.page * paginationModel.pageSize,
    },
    filterModel: { items: [] },
  });
  return data;
}

const MutateContext = React.createContext<() => void>(() => {});
const DataContext = React.createContext<DataSource<any> | null>(null);

interface DeleteActionProps {
  id: GridRowId;
}

function DeleteAction({ id }: DeleteActionProps) {
  const data = React.useContext(DataContext);
  const mutate = React.useContext(MutateContext);
  invariant(data, "Data context missing");

  const handleClick = React.useCallback(() => {
    data.deleteRow?.({ id });
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
  dataSource: DataSource<R>;
  columns?: GridColDef[];
}

export default function MyClientDataGrid<R extends GridValidRowModel>({
  dataSource,
  columns: columnsProp,
}: MyClientDataGridProps<R>) {
  const [serverSortModel, setServerSortModel] = React.useState<GridSortModel>(
    [],
  );

  const [rawPaginationModel, setRawPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const {
    data: listResult,
    isLoading,
    mutate,
    error,
  } = useSWR<ListRowsResult<R>>(
    [dataSource.getRows, rawPaginationModel, serverSortModel],
    callGetRows as any,
  );

  const listResultColumns = listResult?.columns;

  const columns: GridColDef[] = React.useMemo(() => {
    if (columnsProp) {
      return columnsProp;
    }

    const serverColumns = listResultColumns || dataSource.columns;

    const columns: GridColDef[] = serverColumns.map(
      ({ valueProp, ...column }) => {
        const result: GridColDef = { ...column };
        if (column.type === "date" || column.type === "dateTime") {
          result.valueGetter = dateValueGetter;
        }

        if (column.editable && !dataSource.updateRow) {
          console.warn("Grid has editable columns, but no update method");
          delete result.editable;
        }

        if (typeof valueProp !== "undefined") {
          result.valueGetter = ({ row }) => row[valueProp];
        }

        return result;
      },
    );

    if (dataSource.deleteRow) {
      columns.push({
        field: "actions",
        type: "actions",
        width: 80,
        getActions: (params) => [<DeleteAction id={params.id} key="delete" />],
      });
    }

    return columns;
  }, [
    columnsProp,
    dataSource.columns,
    dataSource.deleteRow,
    dataSource.updateRow,
    listResultColumns,
  ]);

  const handleProcessRowUpdate = React.useCallback(
    async (newRow: R, oldRow: R) => {
      await dataSource.updateRow?.({ id: newRow.id, values: newRow });
      return newRow;
    },
    [dataSource],
  );

  const rows = listResult?.rows ?? [];

  const rowIdField = listResult?.rowIdField;

  return (
    <Box sx={{ width: "100%", height: 400, position: "relative" }}>
      <DataContext.Provider value={dataSource}>
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
              rowCount={100000}
              pagination
              paginationMode="server"
              paginationModel={rawPaginationModel}
              onPaginationModelChange={setRawPaginationModel}
              sortingMode="server"
              sortModel={serverSortModel}
              onSortModelChange={setServerSortModel}
              processRowUpdate={
                dataSource.updateRow ? handleProcessRowUpdate : undefined
              }
            />
          )}
        </MutateContext.Provider>
      </DataContext.Provider>
    </Box>
  );
}
