// @ts-nocheck
"use client";

import {
  DataGridProProps,
  DataGridPro,
  GridRowsProp,
  GridColDef,
  useGridApiRef,
  GridPaginationModel,
  GridActionsColDef,
  GridRowId,
  GridFilterModel,
  GridSortModel,
  GridNoRowsOverlay,
  GridRowModes,
  GridApiPro,
  GridRowModesModel,
  GridRowModel,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  gridVisibleColumnFieldsSelector,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowEditStartReasons,
  GridLogicOperator,
  GridValidRowModel,
  GridValueGetterParams,
} from "@mui/x-data-grid-pro";
import {
  Typography,
  Box,
  Link,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
  SxProps,
  styled,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import invariant from "invariant";
import useLatest from "../useLatest";
import ErrorIcon from "@mui/icons-material/Error";
import React from "react";
import SkeletonLoadingOverlay from "./SkeletonLoadingOverlay";
import {
  DataSource,
  PaginationMode,
  PaginationModel,
  ServerGridColDef,
} from "../types";

const OverlayRoot = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
}));

interface ErrorContentProps {
  sx?: SxProps;
  error: Error;
}

export function ErrorContent({ sx, error }: ErrorContentProps) {
  const errMessage = error.message;
  return (
    <OverlayRoot sx={sx}>
      <Typography sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
        <ErrorIcon fontSize="small" color="error" />
        Error
      </Typography>
      <Typography variant="body2">{errMessage}</Typography>
    </OverlayRoot>
  );
}

function dateValueGetter({ value }: GridValueGetterParams): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Date(value);
}

function errorFrom(maybeError: NonNullable<unknown>): Error;
function errorFrom(maybeError: unknown): Error | undefined;
function errorFrom(maybeError: unknown): Error | undefined {
  if (!maybeError) {
    return undefined;
  }

  if (maybeError instanceof Error) {
    return maybeError;
  }

  return new Error("Unknown error", { cause: maybeError });
}

const DRAFT_ROW_MARKER = Symbol("draftRow");

const ACTIONS_COLUMN_FIELD = "___actions___";

const SetActionResultContext = React.createContext<
  ((result: ActionResult) => void) | undefined
>(undefined);

type ActionResult =
  | {
      action: "create";
      id: GridRowId;
      error?: undefined;
    }
  | {
      action: "create";
      id?: undefined;
      error: Error;
    }
  | {
      action: "update";
      id: GridRowId;
      error?: Error;
    }
  | {
      action: "delete";
      id: GridRowId;
      error?: Error;
    };

const EMPTY_ROWS: GridRowsProp = [];
const EMPTY_SERVER_COLUMNS: ServerGridColDef[] = [];
const EMPTY_COLUMNS: GridColDef[] = [];

interface ToolpadDataGridProps<R extends GridValidRowModel>
  extends DataGridProProps<R> {
  dataSource: DataSource<R, PaginationMode>;
}

interface DeleteActionProps<R extends GridValidRowModel> {
  id: GridRowId;
  dataSource: DataSource<R, PaginationMode>;
  refetch: () => unknown;
}

function DeleteAction<R extends GridValidRowModel>({
  id,
  dataSource,
  refetch,
}: DeleteActionProps<R>) {
  const [loading, setLoading] = React.useState(false);

  const setActionResult = React.useContext(SetActionResultContext);
  invariant(setActionResult, "setActionResult must be defined");

  const handleDeleteClick = React.useCallback(async () => {
    invariant(dataSource.deleteRow, "dataSource must be defined");
    setLoading(true);
    try {
      await dataSource.deleteRow({ id });
      await refetch();

      setActionResult({ action: "delete", id });
    } catch (error) {
      setActionResult({ action: "delete", id, error: errorFrom(error) });
    } finally {
      setLoading(false);
    }
  }, [dataSource, id, refetch, setActionResult]);

  return (
    <IconButton
      onClick={handleDeleteClick}
      size="small"
      aria-label={`Delete row with id "${id}"`}
    >
      {loading ? (
        <CircularProgress size={16} />
      ) : (
        <DeleteIcon fontSize="inherit" />
      )}
    </IconButton>
  );
}

interface EditToolbarProps {
  hasCreateButton?: boolean;
  createDisabled?: boolean;
  onCreateClick?: () => void;
}

function EditToolbar({
  hasCreateButton,
  onCreateClick,
  createDisabled,
}: EditToolbarProps) {
  return (
    <GridToolbarContainer>
      {hasCreateButton ? (
        <Button
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateClick}
          disabled={createDisabled}
        >
          Add record
        </Button>
      ) : null}
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

interface DataProviderDataGridProps extends Partial<DataGridProProps> {
  rowLoadingError?: unknown;
  getActions?: GridActionsColDef["getActions"];
}

function useDataSourceDataGridProps<R extends GridValidRowModel>(
  dataSource: DataSource<R, PaginationMode> | null,
  apiRef: React.MutableRefObject<GridApiPro>,
  columnsProp: readonly GridColDef<R>[] | undefined,
  setActionResult: (result: ActionResult) => void,
): DataProviderDataGridProps {
  const [rawPaginationModel, setRawPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 100,
    });

  const mapPageToNextCursor = React.useRef(new Map<number, string>());

  const paginationModel = React.useMemo<PaginationModel<any>>(() => {
    const page = rawPaginationModel.page;
    const pageSize = rawPaginationModel.pageSize;
    if (dataSource?.paginationMode === "cursor") {
      // cursor based pagination
      let cursor: string | null = null;
      if (page !== 0) {
        cursor = mapPageToNextCursor.current.get(page - 1) ?? null;
        if (cursor === null) {
          throw new Error(`No cursor found for page ${page - 1}`);
        }
      }
      return {
        cursor,
        pageSize,
      };
    }

    // index based pagination
    return {
      start: page * pageSize,
      pageSize,
    };
  }, [
    dataSource?.paginationMode,
    rawPaginationModel.page,
    rawPaginationModel.pageSize,
  ]);

  const [rawFilterModel, setRawFilterModel] = React.useState<GridFilterModel>();

  const filterModel = React.useMemo<GridFilterModel>(
    () => ({
      items:
        rawFilterModel?.items.map(({ field, operator, value }) => ({
          field,
          operator,
          value,
        })) ?? [],
      logicOperator: rawFilterModel?.logicOperator ?? GridLogicOperator.And,
    }),
    [rawFilterModel],
  );

  const [rawSortModel, setRawSortModel] = React.useState<GridSortModel>();

  const sortModel = React.useMemo<GridSortModel>(
    () =>
      rawSortModel?.map(({ field, sort }) => ({
        field,
        sort: sort ?? "asc",
      })) ?? [],
    [rawSortModel],
  );

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {},
  );

  const isEditing = React.useMemo(
    () =>
      Object.values(rowModesModel).some(
        (mode) => mode.mode === GridRowModes.Edit,
      ),
    [rowModesModel],
  );

  const [draftRow, setDraftRow] = React.useState<any>(null);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event,
  ) => {
    // Blurring the cell shouldn't end edit mode
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    } else {
      setDraftRow(null);
    }
  };

  const handleRowEditStart: GridEventListener<"rowEditStart"> = (
    params,
    event,
  ) => {
    if (
      isEditing &&
      params.reason === GridRowEditStartReasons.cellDoubleClick
    ) {
      event.defaultMuiPrevented = true;
    }
  };

  const {
    data,
    isFetching,
    isPlaceholderData,
    isLoading,
    error: rowLoadingError,
    refetch,
  } = useQuery({
    enabled: !!dataSource,
    queryKey: [dataSource?.getRows, paginationModel, filterModel, sortModel],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      invariant(dataSource, "dataProvider must be defined");

      const result = await dataSource.getRows({
        paginationModel,
        filterModel,
        sortModel,
      });

      if (dataSource.paginationMode === "cursor") {
        if (typeof result.cursor === "undefined") {
          throw new Error(
            `No cursor returned for page ${rawPaginationModel.page}. Return \`null\` to signal the end of the data.`,
          );
        }

        if (typeof result.cursor === "string") {
          mapPageToNextCursor.current.set(
            rawPaginationModel.page,
            result.cursor,
          );
        }
      }

      return result;
    },
  });

  const rowCount =
    data?.totalCount ??
    (data?.hasNextPage
      ? (rawPaginationModel.page + 1) * rawPaginationModel.pageSize + 1
      : undefined) ??
    0;

  const [rowUpdating, setRowUpdating] = React.useState<
    Partial<Record<string, boolean>>
  >({});

  const handleProcessRowUpdate = React.useCallback(
    async (newRow: GridRowModel, oldRow: GridRowModel) => {
      apiRef.current.getRowId(oldRow);
      const id = apiRef.current.getRowId(oldRow);
      const values = Object.fromEntries(
        Object.entries(newRow).filter(([key, value]) => value !== oldRow[key]),
      );

      const action = oldRow[DRAFT_ROW_MARKER] ? "create" : "update";

      setRowUpdating((oldState) => ({ ...oldState, [id]: true }));

      try {
        if (action === "create") {
          try {
            invariant(
              dataSource?.createRow,
              "Edit action should be unavailable when dataProvider.createRow is not defined",
            );
            const newRecord = await dataSource.createRow({ values });
            if (!newRecord) {
              throw new Error("No record returned by createRow");
            }

            setActionResult({ action, id: apiRef.current.getRowId(newRecord) });
            return newRecord;
          } catch (error) {
            setActionResult({ action, error: errorFrom(error) });
            throw error;
          }
        } else {
          try {
            invariant(
              dataSource?.updateRow,
              "Edit action should be unavailable when dataProvider.updateRow is not defined",
            );
            let newRecord = await dataSource.updateRow({ id, values });
            newRecord ??= newRow;
            setActionResult({ action, id: apiRef.current.getRowId(newRecord) });
            return newRecord;
          } catch (error) {
            setActionResult({ action, id, error: errorFrom(error) });
            throw error;
          }
        }
      } finally {
        setRowUpdating((oldState) => {
          const { [id]: discard, ...newState } = oldState;
          return newState;
        });
        setDraftRow(null);
        await refetch();
      }
    },
    [apiRef, dataSource, refetch, setActionResult],
  );

  const getActions = React.useMemo<
    GridActionsColDef["getActions"] | undefined
  >(() => {
    if (!dataSource?.deleteRow && !dataSource?.updateRow) {
      return undefined;
    }

    return ({ id, row }) => {
      const result = [];

      if (dataSource.updateRow) {
        const rowIsInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        const rowIsUpdating = rowUpdating[id];

        const isDraft = row[DRAFT_ROW_MARKER];

        if (rowIsInEditMode || rowIsUpdating) {
          return [
            <IconButton
              key="commit"
              size="small"
              aria-label={`Save updates to ${
                isDraft ? "new row" : `row with id "${id}"`
              }`}
              disabled={rowIsUpdating}
              onClick={async () => {
                apiRef.current.stopRowEditMode({ id });
              }}
            >
              {rowIsUpdating ? (
                <CircularProgress size={16} />
              ) : (
                <SaveIcon fontSize="inherit" />
              )}
            </IconButton>,
            <IconButton
              key="cancel"
              size="small"
              aria-label="Cancel updates"
              disabled={rowIsUpdating}
              onClick={() => {
                setDraftRow(null);
                apiRef.current.stopRowEditMode({
                  id,
                  ignoreModifications: true,
                });
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>,
          ];
        }

        if (!isEditing) {
          result.push(
            <IconButton
              key="update"
              onClick={() => {
                apiRef.current.startRowEditMode({ id });
              }}
              size="small"
              aria-label={`Edit row with id "${id}"`}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>,
          );
        }
      }

      if (!isEditing) {
        if (dataSource.deleteRow) {
          result.push(
            <DeleteAction
              key="delete"
              id={id}
              dataSource={dataSource}
              refetch={refetch}
            />,
          );
        }
      }

      return result;
    };
  }, [apiRef, dataSource, isEditing, refetch, rowModesModel, rowUpdating]);

  const rows = React.useMemo<GridRowsProp>(() => {
    let rowData = data?.rows ?? [];
    if (draftRow) {
      rowData = [draftRow, ...rowData];
    }
    return rowData;
  }, [data?.rows, draftRow]);

  const columns: readonly GridColDef[] = React.useMemo(() => {
    if (columnsProp) {
      return columnsProp;
    }

    const serverColumns = data?.columns || EMPTY_SERVER_COLUMNS;

    const columns: GridColDef[] = serverColumns.map(
      ({ valueProp, ...column }) => {
        const result: GridColDef = { ...column };
        if (column.type === "date" || column.type === "dateTime") {
          result.valueGetter = dateValueGetter;
        }

        if (column.editable && !dataSource?.updateRow) {
          console.warn("Grid has editable columns, but no update method");
          delete result.editable;
        }

        if (typeof valueProp !== "undefined") {
          result.valueGetter = ({ row }) => row[valueProp];
        }

        return result;
      },
    );

    if (getActions) {
      columns.push({
        field: ACTIONS_COLUMN_FIELD,
        type: "actions",
        align: "right",
        resizable: false,
        pinnable: false,
        getActions,
      });
    }

    return columns;
  }, [columnsProp, data?.columns, dataSource?.updateRow, getActions]);

  if (!dataSource) {
    return {};
  }

  return {
    columns: columns,
    loading: isLoading || (isPlaceholderData && isFetching),
    paginationMode: "server",
    filterMode: "server",
    sortingMode: "server",
    pagination: true,
    rowCount,
    paginationModel: rawPaginationModel,
    onPaginationModelChange(model) {
      setRawPaginationModel((prevModel) => {
        if (prevModel.pageSize !== model.pageSize) {
          return { ...model, page: 0 };
        }
        return model;
      });
    },
    filterModel: rawFilterModel,
    onFilterModelChange: setRawFilterModel,
    sortModel: rawSortModel,
    onSortModelChange: setRawSortModel,
    rows,
    rowLoadingError,
    getActions,
    editMode: "row",
    rowModesModel,
    onRowModesModelChange: (model) => setRowModesModel(model),
    processRowUpdate: handleProcessRowUpdate,
    onRowEditStart: handleRowEditStart,
    onRowEditStop: handleRowEditStop,
    slots: {
      toolbar: EditToolbar,
    },
    slotProps: {
      toolbar: {
        hasCreateButton: !!dataSource.createRow,
        createDisabled: !!isEditing,
        onCreateClick: () => {
          const draftRowId = crypto.randomUUID();
          setDraftRow({ id: draftRowId, [DRAFT_ROW_MARKER]: true });
          const visibleFields = gridVisibleColumnFieldsSelector(apiRef);
          const fieldToFocus =
            visibleFields.length > 0 ? visibleFields[0] : undefined;
          setRowModesModel((oldModel) => ({
            ...oldModel,
            [draftRowId]: { mode: GridRowModes.Edit, fieldToFocus },
          }));
          apiRef.current.scrollToIndexes({ rowIndex: 0, colIndex: 0 });
        },
      },
    },
  };
}

interface NoRowsOverlayProps
  extends React.ComponentProps<typeof GridNoRowsOverlay> {
  error: Error;
}

function NoRowsOverlay(props: NoRowsOverlayProps) {
  if (props.error) {
    return <ErrorContent sx={{ height: "100%" }} error={props.error} />;
  }

  return <GridNoRowsOverlay {...props} />;
}

interface ActionResultOverlayProps {
  result: ActionResult | null;
  onClose: () => void;
  apiRef: React.MutableRefObject<GridApiPro>;
}

function ActionResultOverlay({
  result,
  onClose,
  apiRef,
}: ActionResultOverlayProps) {
  const open = !!result;
  const actionError = result?.error;

  React.useEffect(() => {
    if (actionError) {
      // Log error to console as well for full stacktrace
      console.error(actionError);
    }
  }, [actionError]);

  const lastResult = useLatest(result);

  let message: React.ReactNode = null;
  if (lastResult) {
    if (lastResult.action === "create") {
      message = lastResult.error ? (
        `Failed to create a record, ${lastResult.error.message}`
      ) : (
        <React.Fragment>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <Link
            href="#"
            color="inherit"
            onClick={(event) => {
              event.preventDefault();
              const index = apiRef.current
                .getAllRowIds()
                .indexOf(lastResult.id);
              const visibleFields = gridVisibleColumnFieldsSelector(apiRef);
              const fieldToFocus: string | undefined = visibleFields[0];
              if (index >= 0 && fieldToFocus) {
                apiRef.current.scrollToIndexes({
                  rowIndex: index,
                  colIndex: 0,
                });
                apiRef.current.setCellFocus(lastResult.id, fieldToFocus);
              }
            }}
            aria-label="Go to new record"
          >
            New record
          </Link>{" "}
          created successfully
        </React.Fragment>
      );
    } else if (lastResult.action === "update") {
      message = lastResult.error
        ? `Failed to update a record, ${lastResult.error.message}`
        : "Record updated successfully";
    } else if (lastResult.action === "delete") {
      message = lastResult.error
        ? `Failed to delete a record, ${lastResult.error.message}`
        : "Record deleted successfully";
    }
  }

  return (
    <Box
      sx={{ mt: 1, position: "absolute", bottom: 0, left: 0, right: 0, m: 2 }}
    >
      <Snackbar
        sx={{ position: "absolute" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={open}
        autoHideDuration={2000}
        onClose={onClose}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <Alert
          severity={lastResult?.error ? "error" : "success"}
          onClose={onClose}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default React.forwardRef(function DataGridComponent<
  R extends GridRowModel,
>(
  {
    columns: columnsProp,
    rows: rowsProp,
    dataSource,
    ...props
  }: ToolpadDataGridProps<R>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const apiRef = useGridApiRef();
  const [actionResult, setActionResult] = React.useState<ActionResult | null>(
    null,
  );

  const {
    rows: dataProviderRowsInput,
    columns: dataProviderColumnsInput,
    slots: dataProviderSlots,
    slotProps: dataProviderSlotProps,
    ...dataProviderProps
  } = useDataSourceDataGridProps<R>(
    dataSource ?? null,
    apiRef,
    columnsProp,
    setActionResult,
  );

  let rowsInput: GridRowsProp;
  let columnsInput: readonly GridColDef[];
  if (dataSource) {
    rowsInput = dataProviderRowsInput ?? EMPTY_ROWS;
    columnsInput = dataProviderColumnsInput ?? EMPTY_COLUMNS;
  } else {
    rowsInput = rowsProp ?? EMPTY_ROWS;
    columnsInput = columnsProp ?? EMPTY_COLUMNS;
  }

  let rowLoadingError: unknown = null;
  if (dataProviderProps?.rowLoadingError) {
    rowLoadingError = dataProviderProps.rowLoadingError;
  }

  return (
    <div
      ref={ref}
      style={{
        height: 400,
        width: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 0 0 0",
        }}
      >
        <SetActionResultContext.Provider value={setActionResult}>
          <DataGridPro
            apiRef={apiRef}
            slots={{
              ...dataProviderSlots,
              loadingOverlay: SkeletonLoadingOverlay,
              noRowsOverlay: NoRowsOverlay,
              toolbar: dataProviderSlots?.toolbar,
            }}
            slotProps={{
              noRowsOverlay: {
                error: rowLoadingError,
              } as any,
              ...dataProviderSlotProps,
            }}
            initialState={{
              pinnedColumns: { right: [ACTIONS_COLUMN_FIELD] },
            }}
            columns={columnsInput}
            rows={rowsInput}
            {...props}
            {...dataProviderProps}
          />
        </SetActionResultContext.Provider>
      </div>

      <ActionResultOverlay
        result={actionResult}
        onClose={() => setActionResult(null)}
        apiRef={apiRef}
      />
    </div>
  );
});
