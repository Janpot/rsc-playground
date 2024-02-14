"use client";

import { Button, IconButton, Paper, Toolbar, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import React from "react";
import "react-grid-layout/css/styles.css";
import { DashboardConfig } from "./schema";
import useResizeObserver from "use-resize-observer";
import { DashboardComponent } from "./components";
import { useRunner } from "react-runner";
import Grid from "@mui/material/Unstable_Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import * as xCharts from "@mui/x-charts";
import * as xDataGridPro from "@mui/x-data-grid-pro";
import AddIcon from "@mui/icons-material/Add";

const DASHBOARD_OBJECT_TOOLS_CLASS = "dashboard-object-tools";

const ComponentsContext = React.createContext<Map<string, DashboardComponent>>(
  new Map(),
);

const DashboardConfigContext = React.createContext<DashboardConfig>({
  layout: { rows: [] },
  objects: {},
});

const SetDashboardConfigContext = React.createContext<
  React.Dispatch<React.SetStateAction<DashboardConfig>>
>(() => {});

interface DashboardObject<P> {
  kind: string;
  props?: P;
}

interface RenderedComponentEditorProps<P> {
  component: DashboardComponent<P>;
  value: DashboardObject<P>;
  onChange: (value: DashboardObject<P>) => void;
}

function RenderedComponentEditor<P>({
  component,
  value,
  onChange,
}: RenderedComponentEditorProps<P>) {
  return (
    <component.Editor
      value={value.props ?? component.initialProps}
      onChange={(newProps) => onChange({ ...value, props: newProps })}
    />
  );
}

interface ComponentEditorProps {
  id: string;
  onClose?: () => void;
}

function ComponentEditor({ id, onClose }: ComponentEditorProps) {
  const dashboard = React.useContext(DashboardConfigContext);
  const setDashboard = React.useContext(SetDashboardConfigContext);
  const components = React.useContext(ComponentsContext);

  const object = dashboard.objects[id];

  if (!object) {
    return <div>No dashboard object found for &quot;{id}&quot;</div>;
  }

  const componentDef = components.get(object.kind);

  if (!componentDef) {
    return <div>No component found for &quot;{object.kind}&quot;</div>;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Toolbar variant="dense">
        <Box sx={{ flex: 1 }} />

        <Button onClick={onClose}>Apply</Button>
        <Button onClick={onClose}>Discard</Button>
      </Toolbar>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <RenderedComponentEditor
          value={object}
          onChange={(newObject) =>
            setDashboard((prev) => ({
              ...prev,
              objects: { ...prev.objects, [id]: newObject },
            }))
          }
          component={componentDef}
        />
      </Box>
    </Box>
  );
}

export interface GenerateContext {
  editMode: boolean;
  useImport: (specifier: string, names: Record<string, string>) => void;
}

function generateDashboardCode(config: DashboardConfig, ctx: GenerateContext) {
  ctx.useImport("@mui/material/Box", { default: "Box" });
  ctx.useImport("@mui/material/Stack", { default: "Stack" });

  return `
    export default function MyDashboard() {
      return (
        <Stack sx={{ p:4 }} spacing={4}>
      ${config.layout.rows
        .map((row, rowIndex) => {
          ctx.useImport("@mui/material/Unstable_Grid2", { default: "Grid" });
          let rowContent: string;
          if (row.items.length <= 0) {
            return "{__runtime.renderEmptyRowContent()}";
          }
          return `<Grid container spacing={4}>${row.items
            .map((item, itemIndex) => {
              if (config.objects[item.id]) {
                return `
                <Grid xs sx={{ position: 'relative' }}>
                <Object${item.id}  />
                ${ctx.editMode ? `{__runtime.renderItemControls("${item.id}", ${rowIndex}, ${itemIndex})}` : ""}

              </Grid>
              `;
              }
              return "{__runtime.renderItemSlot()}";
            })
            .join("\n")}</Grid>`;
        })
        .join("\n")}
      ${ctx.editMode ? `{__runtime.renderAddRow()}` : ""}
        </Stack>
      )
    }
  `;
}

const globalScope = {
  import: {
    "@mui/material/Unstable_Grid2": Grid,
    "@mui/material/Box": Box,
    "@mui/material/Stack": Stack,
    "@mui/material/Paper": Paper,
    "@mui/material/Typography": Typography,
    "@mui/x-charts": xCharts,
    "@mui/x-data-grid-pro": xDataGridPro,
  },
};

function getItemId() {
  return `item_${crypto.getRandomValues(new Uint32Array(1))[0]}`;
}

export interface ClientDashboardProps {
  value: DashboardConfig;
  saveConfig?: (value: DashboardConfig) => void;
  components: Map<string, DashboardComponent>;
}

export default function ClientDashboard({
  value,
  saveConfig,
  components,
}: ClientDashboardProps) {
  const editable: boolean = !!saveConfig;
  const [editMode, setEditMode] = React.useState(false);
  const [input, setInput] = React.useState(value);

  const handleAddComponent = (kind: string) => () => {};

  const handleSave = React.useCallback(async () => {
    await saveConfig?.(input);
  }, [input, saveConfig]);

  const { ref: rootRef, width: rootWidth } =
    useResizeObserver<HTMLDivElement>();

  const [editedObject, setEditedObject] = React.useState<string | null>(null);

  const dashboardCode = React.useMemo(() => {
    const imports = new Map<string, Record<string, string>>();
    const requireImport = (
      specifier: string,
      names: Record<string, string>,
    ) => {
      let existingNames = imports.get(specifier);
      if (!existingNames) {
        existingNames = {};
        imports.set(specifier, existingNames);
      }
      for (const [name, specifier] of Object.entries(names)) {
        existingNames[name] = specifier;
      }
    };

    console.log(input);

    const componentsCode = Array.from(
      Object.entries(input.objects),
      ([id, object]) => {
        const component = components.get(object.kind);
        const name = `Object${id}`;
        if (!component?.generateCode) {
          requireImport("@mui/material/Paper", { default: "Paper" });
          return `const ${name} = () => <Paper sx={{width:'100%', height: '100%'}}>Not found</Paper>`;
        }
        return component.generateCode(
          name,
          object.props ?? component.initialProps,
          { editMode, useImport: requireImport },
        );
      },
    ).join("\n\n");

    const code = generateDashboardCode(input, {
      editMode,
      useImport: requireImport,
    });

    return `
      ${Array.from(
        imports.entries(),
        ([specifier, names]) =>
          `import {${Object.entries(names)
            .map(([name, specifier]) => `${name} as ${specifier}`)
            .join(", ")}} from "${specifier}";`,
      ).join("\n")}

      ${componentsCode}

      ${code}
     `;
  }, [components, editMode, input]);

  const scope = React.useMemo(() => {
    return {
      __runtime: {
        renderAddRow: () => {
          return (
            <Box>
              <Button
                onClick={() => {
                  setInput((prev) => ({
                    ...prev,
                    layout: {
                      rows: [
                        ...prev.layout.rows,
                        {
                          items: [],
                        },
                      ],
                    },
                  }));
                }}
              >
                Add Row
              </Button>
            </Box>
          );
        },
        renderEmptyRowContent: () => {
          return (
            <Grid xs>
              <Box
                sx={{
                  outline: 1,
                  outlineStyle: "dashed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                }}
              >
                <Button>Add object</Button>
              </Box>
            </Grid>
          );
        },
        renderItemSlot: () => {
          return <Grid xs>Add item</Grid>;
        },
        renderItemControls: (
          id: string,
          rowIndex: number,
          itemIndex: number,
        ) => {
          return (
            <>
              <Box
                className={DASHBOARD_OBJECT_TOOLS_CLASS}
                sx={{ position: "absolute", top: 0, right: 0 }}
              >
                <IconButton
                  size="small"
                  onClick={() => setEditedObject(id)}
                  disabled={editedObject === id}
                >
                  <EditIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setInput((prev) => {
                      return prev;
                    });
                  }}
                >
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  right: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  top: 0,
                  bottom: 0,
                  width: "20px",
                }}
              >
                <div>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setInput((prev) => {
                        return {
                          ...prev,
                          layout: {
                            ...prev.layout,
                            rows: prev.layout.rows.map((row, i) => {
                              if (i === rowIndex) {
                                const newItems = [...row.items];
                                newItems.splice(itemIndex + 1, 0, {
                                  id: getItemId(),
                                });
                                return {
                                  items: newItems,
                                };
                              }
                              return row;
                            }),
                          },
                        };
                      });
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </div>
              </Box>
            </>
          );
        },
      },
      ...globalScope,
    };
  }, [editedObject]);

  const { element: dashboardElm, error } = useRunner({
    code: dashboardCode,
    scope,
  });

  // console.log(dashboardCode);
  console.log("err", error);

  return (
    <DashboardConfigContext.Provider value={input}>
      <SetDashboardConfigContext.Provider value={setInput}>
        <ComponentsContext.Provider value={components}>
          {editable ? (
            <Box
              ref={rootRef}
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
                  overflow: "auto",
                }}
              >
                {editedObject ? (
                  <ComponentEditor
                    id={editedObject}
                    onClose={() => setEditedObject(null)}
                  />
                ) : (
                  <>
                    <Toolbar variant="dense">
                      <Box sx={{ flex: 1 }} />
                      {editMode ? (
                        <>
                          <Button onClick={handleAddComponent("Chart")}>
                            Add Chart
                          </Button>
                          <Button onClick={handleAddComponent("DataGrid")}>
                            Add DataGrid
                          </Button>
                          <Button onClick={handleSave}>Save</Button>
                          <Button onClick={() => setEditMode(false)}>
                            Close
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setEditMode(true)}>Edit</Button>
                      )}
                    </Toolbar>
                    {dashboardElm}
                  </>
                )}
              </Box>
            </Box>
          ) : (
            dashboardElm
          )}
        </ComponentsContext.Provider>
      </SetDashboardConfigContext.Provider>
    </DashboardConfigContext.Provider>
  );
}
