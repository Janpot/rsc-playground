"use client";

import { Box, Button, IconButton, Paper, Toolbar } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";
import {
  Responsive as ResponsiveGridLayout,
  Layout,
  Layouts,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { DashboardConfig, ObjectLayouts } from "./schema";
import { Panel, PanelGroup, PanelResizeHandle } from "./resizablePanels";
import useResizeObserver from "use-resize-observer";

const DRAGGABLE_HANDLE_CLASS = "react-grid-draggable-handle";

export interface EditorProps<P> {
  value: P;
  onChange: (value: P) => void;
}

export interface DashboardComponent<P = {}> {
  Component: React.ComponentType<P>;
  Editor: React.ComponentType<EditorProps<P>>;
  initialProps: P;
}

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
  layouts: ObjectLayouts;
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
    <Box>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
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
  );
}

interface RenderedComponentProps {
  value: DashboardConfig["objects"][number];
}

function RenderedComponent({ value }: RenderedComponentProps) {
  const components = React.useContext(ComponentsContext);
  const componentDef = components.get(value.kind);

  if (!componentDef) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 1,
        }}
      >
        No component found for &quot;{value.kind}&quot;
      </Box>
    );
  }

  return <componentDef.Component {...value.props} />;
}

function DashboardContent() {}

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

  const [responsiveState, setResponsiveState] = React.useState<{
    breakpoint: string;
    cols: number;
  }>();

  const handleAddChart = React.useCallback(() => {
    const id = `item-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
    setInput((prev) => {
      return {
        ...prev,
        objects: {
          ...prev.objects,
          [id]: {
            kind: "BarChart",
            layouts: {
              [responsiveState?.breakpoint ?? "lg"]: { x: 0, y: 0, w: 2, h: 2 },
            },
          },
        },
      };
    });
  }, [responsiveState?.breakpoint]);

  const handleSave = React.useCallback(async () => {
    await saveConfig?.(input);
  }, [input, saveConfig]);

  const handleLayoutChange = React.useCallback(
    (layout: Layout[], layouts: Layouts) => {
      const layoutMaps = new Map(
        Object.entries(layouts).map(([breakpoint, layout]) => [
          breakpoint,
          new Map(layout.map((item) => [item.i, item])),
        ]),
      );
      setInput((prev) => {
        return {
          ...prev,
          objects: Object.fromEntries(
            Object.entries(prev.objects).map(([id, object]) => {
              const layouts: ObjectLayouts = {};
              for (const [breakpoint, layoutMap] of layoutMaps) {
                const item = layoutMap.get(id);
                if (item) {
                  layouts[breakpoint] = {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                  };
                }
              }
              return [id, { ...object, layouts }];
            }),
          ),
        };
      });
    },
    [],
  );

  const layouts: Layouts = React.useMemo(() => {
    const result: Layouts = {};

    for (const [id, object] of Object.entries(input.objects)) {
      for (const [breakpoint, layout] of Object.entries(object.layouts)) {
        result[breakpoint] ??= [];
        result[breakpoint].push({
          i: id,
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          resizeHandles: ["se"],
        });
      }
    }

    return result;
  }, [input.objects]);

  const handleBreakpointChange = React.useCallback(
    (breakpoint: string, cols: number) => {
      setResponsiveState({ breakpoint, cols });
    },
    [],
  );

  const { ref: rootRef, width: rootWidth } =
    useResizeObserver<HTMLDivElement>();

  const [editedObject, setEditedObject] = React.useState<string | null>(null);

  const { ref: dashboardContentRef, width: dashboardWidth } =
    useResizeObserver<HTMLDivElement>();

  const dashboardContent = (
    <Box
      ref={dashboardContentRef}
      sx={{
        width: "100%",
        height: "100%",
        ".react-grid-layout, .react-grid-item": {
          transition: "unset",
        },
      }}
    >
      <ResponsiveGridLayout
        width={dashboardWidth}
        className="layout"
        layouts={layouts}
        onBreakpointChange={handleBreakpointChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        onLayoutChange={handleLayoutChange}
        isResizable={editMode}
        isDraggable={editMode}
        isDroppable={editMode}
        draggableHandle={`.${DRAGGABLE_HANDLE_CLASS}`}
      >
        {Object.entries(input.objects).map(([id, value]) => {
          return (
            <Paper key={id} sx={{ position: "relative" }}>
              <RenderedComponent value={value} />
              {editMode ? (
                <Box sx={{ position: "absolute", top: 0, right: 0 }}>
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
                        return {
                          ...prev,
                          objects: Object.fromEntries(
                            Object.entries(prev.objects).filter(
                              ([key]) => key !== id,
                            ),
                          ),
                        };
                      });
                    }}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                  <Box
                    className={DRAGGABLE_HANDLE_CLASS}
                    sx={{
                      display: "inline-flex",
                      padding: "5px",
                      verticalAlign: "middle",
                    }}
                  >
                    <DragIndicatorIcon fontSize="small" />
                  </Box>
                </Box>
              ) : null}
            </Paper>
          );
        })}
      </ResponsiveGridLayout>
    </Box>
  );

  return (
    <DashboardConfigContext.Provider value={input}>
      <SetDashboardConfigContext.Provider value={setInput}>
        <ComponentsContext.Provider value={components}>
          {editable ? (
            <Box ref={rootRef}>
              <Toolbar>
                <Box sx={{ flex: 1 }} />
                {editMode ? (
                  <>
                    <Button onClick={handleAddChart}>Add Chart</Button>
                    <Button onClick={handleSave}>Save</Button>
                    <Button onClick={() => setEditMode(false)}>Close</Button>
                  </>
                ) : (
                  <Button onClick={() => setEditMode(true)}>Edit</Button>
                )}
              </Toolbar>
              <PanelGroup direction="horizontal">
                <Panel
                  id="dashboard-content"
                  order={1}
                  style={{ overflow: "auto" }}
                >
                  <Box sx={{ width: rootWidth }}>{dashboardContent}</Box>
                </Panel>
                {editedObject ? (
                  <>
                    <PanelResizeHandle />
                    <Panel defaultSize={20} id="component-editor" order={2}>
                      <ComponentEditor
                        id={editedObject}
                        onClose={() => setEditedObject(null)}
                      />
                    </Panel>
                  </>
                ) : null}
              </PanelGroup>
            </Box>
          ) : (
            dashboardContent
          )}
        </ComponentsContext.Provider>
      </SetDashboardConfigContext.Provider>
    </DashboardConfigContext.Provider>
  );
}
