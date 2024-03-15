"use client";

import React, { use } from "react";
import { DataGrid } from "../DataGrid";
import {
  ResolvedDataProvider,
  Datum,
  useGetOne,
  useCreateOne,
  useUpdateOne,
  FieldDef,
  Mutation,
  useDeleteOne,
} from "../data";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Container,
  Dialog,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useParams, usePathname } from "next/navigation";
import invariant from "invariant";
import { ArrowBack } from "@mui/icons-material";
import { Controller, DefaultValues, Path, useForm } from "react-hook-form";
import { LoadingButton } from "@mui/lab";
import { useNavigate } from "../navigation";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { GridEventListener } from "@mui/x-data-grid-pro";
import { ErrorOverlay, LoadingOverlay } from "../components";

const CrudContext = React.createContext<{
  dataProvider: ResolvedDataProvider<any>;
  name: string;
  basePath: string;
} | null>(null);

function useCrudContext() {
  const context = React.useContext(CrudContext);
  invariant(context, "Must always be used inside CrudContext");
  return context;
}

/*
/resource
/resource/new
/resource/edit/123
/resource/show/123
/resource/delete/123
*/
type ParsedMethod =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "show"; id: string }
  | { kind: "edit"; id: string };

function asArray<T>(value?: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return typeof value === "undefined" ? [] : [value];
}

function parseMethod(methodParam?: string | string[]): ParsedMethod | null {
  const segments = asArray(methodParam);

  if (segments.length === 0) {
    return { kind: "list" };
  }
  if (segments[0] === "new" && segments.length === 1) {
    return { kind: "new" };
  }
  if (segments[0] === "edit" && segments.length === 2) {
    return { kind: "edit", id: segments[1] };
  }
  if (segments[0] === "show" && segments.length === 2) {
    return { kind: "show", id: segments[1] };
  }

  return null;
}

interface CrudBreadcrumbsProps {
  segments: string[];
}

function CrudBreadcrumbs({ segments }: CrudBreadcrumbsProps) {
  const { name, basePath } = useCrudContext();
  const crumbs = [
    <Link
      key="resource"
      component={NextLink}
      underline="hover"
      color="inherit"
      href={basePath}
    >
      {name ?? "Resource"}
    </Link>,
    ...segments.map((segment, index, array) => (
      <Typography
        key={`resource:${index}`}
        {...(index === array.length - 1
          ? { color: "text.primary", "aria-current": "page" }
          : {})}
      >
        {segment}
      </Typography>
    )),
  ];
  return <Breadcrumbs>{crumbs}</Breadcrumbs>;
}

interface ListPageProps {}

function ListPage({}: ListPageProps) {
  const { basePath, name, dataProvider } = useCrudContext();
  const navigate = useNavigate();
  const handleRowClick = React.useCallback<GridEventListener<"rowClick">>(
    ({ id }) => {
      navigate(`${basePath}/show/${id}`);
    },
    [basePath, navigate],
  );
  return (
    <Box>
      <Toolbar disableGutters>
        <Typography variant="h4" component="h1">
          {name}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box>
          <Button component={NextLink} href={`${basePath}/new`}>
            New
          </Button>
        </Box>
      </Toolbar>
      <DataGrid dataProvider={dataProvider} onRowClick={handleRowClick} />
    </Box>
  );
}

interface DataEditorProps<R extends Datum> {
  value?: R;
  onChange: (value: R) => void;
  pending?: boolean;
  error?: Error | null;
}

function getDefaultFieldValue(field?: FieldDef<any, any>): any {
  switch (field?.type) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "date":
      return new Date().toISOString().split("T")[0];
  }
  return "";
}

function DataEditor<R extends Datum>({
  value,
  onChange,
  pending,
  error,
}: DataEditorProps<R>) {
  const { basePath, dataProvider } = useCrudContext();

  const { control, handleSubmit } = useForm<R>({
    defaultValues: Object.fromEntries(
      Object.entries(dataProvider.fields ?? {}).map(([name, field]) => {
        return [name, value?.[name] ?? getDefaultFieldValue(field)];
      }),
    ) as DefaultValues<R>,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onChange)}>
      <Stack direction="column" spacing={2}>
        {Object.entries(dataProvider.fields ?? {}).map(([name, field]) => {
          return (
            <Controller
              key={name}
              name={name as Path<R>}
              control={control}
              render={(params) => {
                switch (field.type) {
                  case "string":
                    return <TextField {...params.field} label={field.label} />;
                  case "number":
                    return <TextField {...params.field} label={field.label} />;
                  case "boolean":
                    return (
                      <FormControlLabel
                        control={<Checkbox {...params.field} />}
                        label={field.label}
                      />
                    );
                  case "date":
                    return (
                      <TextField
                        {...params.field}
                        label={field.label}
                        type="date"
                      />
                    );
                }
                return <TextField {...params.field} label={field.label} />;
              }}
            />
          );
        })}
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1 }} />
          <LoadingButton
            type="submit"
            variant="contained"
            color="primary"
            loading={pending}
          >
            Save
          </LoadingButton>
        </Toolbar>
        {error ? <Alert color="error">{error.message}</Alert> : null}
      </Stack>
    </Box>
  );
}

interface NewPageProps {}

function NewPage<R extends Datum>({}: NewPageProps) {
  const navigate = useNavigate();
  const { basePath, dataProvider } = useCrudContext();
  const createMutation = useCreateOne(dataProvider);

  const handleChange = React.useCallback(
    async (data: R) => {
      try {
        const newRecord = await createMutation.mutate(data);
        navigate(`${basePath}/show/${newRecord.id}`);
      } catch {}
    },
    [basePath, createMutation, navigate],
  );

  return (
    <Box>
      <Toolbar disableGutters>
        <Stack direction="row" spacing={2}>
          <IconButton component={NextLink} href={basePath}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            New
          </Typography>
        </Stack>
      </Toolbar>
      <CrudBreadcrumbs segments={["New"]} />
      <Box sx={{ my: 4 }}>
        <DataEditor
          onChange={handleChange}
          pending={createMutation.pending}
          error={createMutation.error}
        />
      </Box>
    </Box>
  );
}

interface AsyncContentProps {
  error?: Error | null;
  loading?: boolean;
  renderContent: () => React.ReactNode;
}

function AsyncContent({ error, loading, renderContent }: AsyncContentProps) {
  if (error) {
    return <ErrorOverlay error={error} />;
  }
  if (loading) {
    return <LoadingOverlay />;
  }
  return renderContent();
}

interface NoDataFoundOverlayProps {
  id: string;
}

function NoDataFoundOverlay({ id }: NoDataFoundOverlayProps) {
  const error = React.useMemo(
    () => new Error(`No data found with id "${id}"`),
    [id],
  );
  return <ErrorOverlay error={error} />;
}

interface ShowPageProps {
  id: string;
}

function ShowPage({ id }: ShowPageProps) {
  const { basePath, name, dataProvider } = useCrudContext();
  const { data, error, loading } = useGetOne(dataProvider, id);
  const deleteMutation = useDeleteOne(dataProvider);

  return (
    <Box>
      <Toolbar disableGutters>
        <Stack direction="row" spacing={2}>
          <IconButton component={NextLink} href={basePath}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Show
          </Typography>
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Box>
          <Button color="error">Delete</Button>
          <Button component={NextLink} href={`${basePath}/edit/${id}`}>
            Edit
          </Button>
        </Box>
      </Toolbar>
      <CrudBreadcrumbs segments={["Show", id]} />
      <Box sx={{ my: 4 }}>
        <AsyncContent
          error={error}
          loading={loading}
          renderContent={() => {
            if (!data) {
              return <NoDataFoundOverlay id={id} />;
            }
            return (
              <Stack direction="column" spacing={2}>
                {Object.entries(dataProvider.fields ?? {}).map(
                  ([name, field]) => {
                    let value = data[name];
                    if (field.valueFormatter) {
                      value = field.valueFormatter(value);
                    }
                    return (
                      <Grid2 container key={name} spacing={2}>
                        <Grid2 xs={3}>
                          <Typography align="right">
                            {field.label ?? name}:
                          </Typography>
                        </Grid2>
                        <Grid2 xs={9}>
                          <Typography>{String(value)}</Typography>
                        </Grid2>
                      </Grid2>
                    );
                  },
                )}
              </Stack>
            );
          }}
        />
      </Box>
    </Box>
  );
}

interface EditPageProps {
  id: string;
}

function EditPage<R extends Datum>({ id }: EditPageProps) {
  const navigate = useNavigate();
  const { basePath, name, dataProvider } = useCrudContext();
  const { data, error, loading } = useGetOne(dataProvider, id);
  const updateMutation = useUpdateOne(dataProvider);

  const handleChange = React.useCallback(
    async (data: R) => {
      try {
        const newRecord = await updateMutation.mutate(id, data);
        navigate(`${basePath}/show/${newRecord.id}`);
      } catch {}
    },
    [basePath, id, navigate, updateMutation],
  );

  return (
    <Box>
      <Toolbar disableGutters>
        <Stack direction="row" spacing={2}>
          <IconButton component={NextLink} href={`${basePath}/show/${id}`}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Edit
          </Typography>
        </Stack>
      </Toolbar>
      <CrudBreadcrumbs segments={["Edit", id]} />
      <Box sx={{ my: 4 }}>
        <AsyncContent
          error={error}
          loading={loading}
          renderContent={() => {
            if (!data) {
              return <NoDataFoundOverlay id={id} />;
            }
            return (
              <DataEditor
                value={data}
                onChange={handleChange}
                pending={updateMutation.pending}
                error={updateMutation.error}
              />
            );
          }}
        />
      </Box>
    </Box>
  );
}

interface PageContentProps {
  method: ParsedMethod;
}

function PageContent({ method }: PageContentProps) {
  switch (method.kind) {
    case "list":
      return <ListPage />;
    case "new":
      return <NewPage />;
    case "edit":
      return <EditPage id={method.id} />;
    case "show":
      return <ShowPage id={method.id} />;
  }
  invariant(false, "Unreachable code");
}

export interface CrudPageProps<R extends Datum> {
  dataProvider: ResolvedDataProvider<R>;
  name?: string;
}

export function CrudPage<R extends Datum>({
  dataProvider,
  name = "Resource",
}: CrudPageProps<R>) {
  const params = useParams();
  const pathname = usePathname();
  const basePath = React.useMemo(() => {
    const segments = asArray(params.method);
    return segments.length > 0
      ? pathname.split("/").slice(0, -segments.length).join("/")
      : pathname;
  }, [params.method, pathname]);

  const method = React.useMemo(
    () => parseMethod(params.method),
    [params.method],
  );

  const contextValue = React.useMemo(() => {
    return {
      dataProvider,
      name,
      basePath,
    };
  }, [basePath, dataProvider, name]);

  return (
    <Container>
      {method ? (
        <CrudContext.Provider value={contextValue}>
          <PageContent method={method} />
        </CrudContext.Provider>
      ) : (
        <Box>Not found</Box>
      )}
    </Container>
  );
}
