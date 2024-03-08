"use client";

import React from "react";
import { DataGrid } from "../DataGrid";
import { ResolvedDataProvider, Datum } from "../data";
import {
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Container,
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
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { LoadingButton } from "@mui/lab";

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

function getMethodLabel(method: ParsedMethod) {
  switch (method.kind) {
    case "list":
      return "List";
    case "new":
      return "New";
    case "edit":
      return "Edit";
    case "show":
      return "Show";
  }
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
      <DataGrid dataProvider={dataProvider} />
    </Box>
  );
}

interface NewPageProps {}

function NewPage({}: NewPageProps) {
  const { name, basePath, dataProvider } = useCrudContext();
  const { mutate, isPending } = useMutation({
    async mutationFn(data: any) {
      await dataProvider.createOne(data);
    },
  });
  const { control, handleSubmit } = useForm({
    defaultValues: Object.fromEntries(
      dataProvider.fields.map((field) => {
        return [field.field, ""];
      }),
    ),
  });
  const onSubmit = (values) => {
    mutate(values);
  };
  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <CrudBreadcrumbs segments={["New"]} />
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
      <Stack direction="column" spacing={2}>
        {dataProvider.fields.map((field) => {
          return (
            <Controller
              key={field.field}
              name={field.field}
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
      </Stack>
      <Toolbar disableGutters>
        <Box sx={{ flexGrow: 1 }} />
        <LoadingButton variant="contained" color="primary" loading={isPending}>
          Save
        </LoadingButton>
      </Toolbar>
    </Box>
  );
}

interface ShowPageProps {
  id: string;
}

function ShowPage({ id }: ShowPageProps) {
  const { name, dataProvider } = useCrudContext();
  return (
    <Box>
      <CrudBreadcrumbs segments={["Show", id]} />
      <Typography>New</Typography>
    </Box>
  );
}

interface EditPageProps {
  id: string;
}

function EditPage({ id }: EditPageProps) {
  const { name, dataProvider } = useCrudContext();
  return (
    <Box>
      <CrudBreadcrumbs segments={["New", id]} />
      <Typography>New</Typography>
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
