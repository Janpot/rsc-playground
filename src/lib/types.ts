import {
  GridColDef,
  GridPaginationModel,
  GridRowId,
  GridSortModel,
  GridValidRowModel,
} from "@mui/x-data-grid-pro";

export type PaginationMode = "pages" | "cursor";
export type DefaultPaginationMode = "pages";

interface CursorPaginationModel {
  cursor: null | string;
  pageSize: number;
}

interface IndexPaginationModel {
  start: number;
  pageSize: number;
}

export type PaginationModel<P extends PaginationMode> = P extends "cursor"
  ? CursorPaginationModel
  : IndexPaginationModel;

export type GetRowsParams<
  R extends GridValidRowModel,
  P extends PaginationMode = DefaultPaginationMode,
> = {
  paginationModel: PaginationModel<P>;
  filterModel: GridFilterModel;
  sortModel: GridSortModel;
};

export interface ServerGridColDef<R extends GridValidRowModel>
  extends Pick<GridColDef<R>, "field" | "type" | "editable" | "headerName"> {
  valueProp?: string;
}

export interface ListRowsResult<R extends GridValidRowModel> {
  rows: R[];
  columns?: ServerGridColDef<R>[];
  rowIdField?: string;
  paginationMode?: "server" | "client";
  sortingMode?: "server" | "client";
}

export interface GetRows<
  R extends GridValidRowModel,
  P extends PaginationMode = DefaultPaginationMode,
> {
  (params: GetRowsParams<R, P>): Promise<ListRowsResult<R>>;
}

export interface CreateRowParams<R> {
  values: R;
}

export interface CreateRow<R extends GridValidRowModel> {
  (params: CreateRowParams<R>): Promise<R>;
}

export interface DeleteRowParams<R extends GridValidRowModel> {
  id: GridRowId;
}

export interface DeleteRow<R extends GridValidRowModel> {
  (params: DeleteRowParams<R>): Promise<void>;
}

export interface UpdateRowParams<R extends GridValidRowModel> {
  id: GridRowId;
  values: Partial<R>;
}

export interface UpdateRow<R extends GridValidRowModel> {
  (params: UpdateRowParams<R>): Promise<R>;
}

export interface DataSource<
  R extends GridValidRowModel,
  P extends PaginationMode = DefaultPaginationMode,
> {
  paginationMode?: P;
  columns: ServerGridColDef<R>[];
  getRows: GetRows<R, P>;
  createRow?: CreateRow<R>;
  updateRow?: UpdateRow<R>;
  deleteRow?: DeleteRow<R>;
}
