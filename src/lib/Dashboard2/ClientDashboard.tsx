"use client";

import { Button, IconButton, Paper, Toolbar, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import React from "react";
import "react-grid-layout/css/styles.css";
import { DashboardConfig, Layout } from "./schema";
import useResizeObserver from "use-resize-observer";
import { DashboardComponent } from "./components";
import { useRunner } from "react-runner";
import Box from "@mui/material/Box";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { IMPORTS, ModuleContext, createModuleContext } from "./codegen";
import { Layout as ReactGridLayout } from "react-grid-layout";

const DASHBOARD_OBJECT_TOOLS_CLASS = "dashboard-object-tools";
const DRAGGABLE_HANLDE_CLASS = "draggable-handle";

const ComponentsContext = React.createContext<Map<string, DashboardComponent>>(
  new Map(),
);

const DashboardConfigContext = React.createContext<DashboardConfig>({
  objects: {},
});

const SetDashboardConfigContext = React.createContext<
  React.Dispatch<React.SetStateAction<DashboardConfig>>
>(() => {});

interface DashboardObject<P> {
  kind: string;
  props?: P;
  layout: Layout;
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
  module: ModuleContext;
}

function generateDashboardCode(config: DashboardConfig, ctx: GenerateContext) {
  ctx.module.requireImport("@mui/material/Box", { default: "Box" });
  ctx.module.requireImport("@mui/material/Stack", { default: "Stack" });
  ctx.module.requireImport("react-grid-layout", {
    default: "GridLayout",
    WidthProvider: "WidthProvider",
  });

  return `
    const ReactGridLayout = WidthProvider(GridLayout);
    export default function MyDashboard() {
      return (
        <ReactGridLayout
          rowHeight={100}
          draggableHandle=".${DRAGGABLE_HANLDE_CLASS}"
          cols={12}
          isDraggable={${String(ctx.editMode)}}
          isResizable={${String(ctx.editMode)}}
          ${
            ctx.editMode
              ? `
            onLayoutChange={__runtime.onLayoutChange}
            onResizeStop={__runtime.onResizeStop}

          `
              : ""
          }

        >
          ${Array.from(Object.entries(config.objects), ([id, object], i) => {
            ctx.module.requireImport("@mui/material/Box", { default: "Box" });
            return `
              <Box key="${id}" data-grid={${JSON.stringify(object.layout)}} sx={{ position: 'relative' }}>
                <Object${id}  />
                ${ctx.editMode ? `{__runtime.renderItemControls(${JSON.stringify(id)})}` : ""}
              </Box>
            `;
          }).join("\n")}
        </ReactGridLayout>
      )
    }
  `;
}

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

    const ctx = {
      editMode,
      module: createModuleContext(),
    };

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
          ctx.module,
        );
      },
    ).join("\n\n");

    const code = generateDashboardCode(input, ctx);

    return `
      ${ctx.module.renderImports()}

      ${componentsCode}

      ${code}
     `;
  }, [components, editMode, input]);

  const scope = React.useMemo(() => {
    return {
      import: IMPORTS,
      __runtime: {
        renderItemControls: (id: string) => {
          return (
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
              <IconButton size="small" className={DRAGGABLE_HANLDE_CLASS}>
                <DragIndicatorIcon fontSize="inherit" />
              </IconButton>
            </Box>
          );
        },
        onLayoutChange: (layout: ReactGridLayout[]) => {
          setInput((prev) => {
            const newObjects: DashboardConfig["objects"] = {};
            for (const objectLayout of layout) {
              const id = objectLayout.i;
              const object = prev.objects[id];
              if (object) {
                newObjects[id] = {
                  ...object,
                  layout: {
                    x: objectLayout.x,
                    y: objectLayout.y,
                    w: objectLayout.w,
                    h: objectLayout.h,
                  },
                };
              }
            }

            return { ...prev, objects: newObjects };
          });
        },
      },
    };
  }, [editedObject]);

  const { element: dashboardElm, error } = useRunner({
    code: dashboardCode,
    scope,
  });

  if (error) {
    console.log("err", error);
  }

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
