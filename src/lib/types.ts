import {
  GridColDef,
  GridRowId,
  GridSortModel,
  GridValidRowModel,
} from "@mui/x-data-grid-pro";

export type PaginationMode = "pages" | "cursor";
export type DefaultPaginationMode = "pages";

type PaginationProps<P extends PaginationMode> = P extends "pages"
  ? {
      page: number;
      pageSize: number;
    }
  : {
      cursor: string;
    };

export type GetRowsParams<
  R extends GridValidRowModel,
  P extends PaginationMode = DefaultPaginationMode
> = PaginationProps<P> & {
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
  P extends PaginationMode = DefaultPaginationMode
> {
  (params: GetRowsParams<R, P>): Promise<ListRowsResult<R>>;
}

export interface CreateRowParams<R> {
  values: R;
}

export interface CreateRow<R extends GridValidRowModel> {
  (params: CreateRowParams<R>): Promise<void>;
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
  (params: UpdateRowParams<R>): Promise<void>;
}

export interface DataSource<
  R extends GridValidRowModel,
  P extends PaginationMode = DefaultPaginationMode
> {
  paginationMode?: P;
  columns: ServerGridColDef<R>[];
  getRows: GetRows<R, P>;
  createRow?: CreateRow<R>;
  updateRow?: UpdateRow<R>;
  deleteRow?: DeleteRow<R>;
}
