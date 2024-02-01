"use client";

import { Box, Button, Paper, Toolbar } from "@mui/material";
import React from "react";
import ReactGridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { DashboardConfig } from "./schema";

export interface DashboardComponent {
  Component: React.ComponentType<any>;
}

export const GridLayout = WidthProvider(ReactGridLayout);

export const ComponentsContext = React.createContext<
  Map<string, DashboardComponent>
>(new Map());

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
          padding: 1,
        }}
      >
        No component found for {value.kind}
      </Box>
    );
  }

  return <componentDef.Component {...value.props} />;
}

interface ComponentMenuProps {
  onDelete?: () => void;
}

function ComponentMenu({ onDelete }: ComponentMenuProps) {
  return null;
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

  const handleAddChart = React.useCallback(() => {
    const id = crypto.getRandomValues(new Uint32Array(1))[0];
    setInput((prev) => {
      return {
        ...prev,
        objects: [
          ...prev.objects,
          { id, kind: "BarChart", x: 0, y: 0, w: 2, h: 2 },
        ],
      };
    });
  }, []);

  const handleSave = React.useCallback(async () => {
    await saveConfig?.(input);
  }, [input, saveConfig]);

  const handleLayoutChange = React.useCallback(
    (layout: ReactGridLayout.Layout[]) => {
      const layoutMap = new Map(layout.map((item) => [Number(item.i), item]));
      setInput((prev) => {
        return {
          ...prev,
          objects: prev.objects.map((item, i) => {
            const layoutItem = layoutMap.get(i);
            if (layoutItem === undefined) {
              return item;
            }
            return {
              ...item,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            };
          }),
        };
      });
    },
    [],
  );

  const layout: ReactGridLayout.Layout[] = React.useMemo(() => {
    return input.objects.map((item, i) => {
      return {
        i: String(i),
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        resizeHandles: ["se"],
      };
    });
  }, [input.objects]);

  return (
    <ComponentsContext.Provider value={components}>
      <Box sx={{ position: "relative" }}>
        {editable ? (
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
        ) : null}
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          onLayoutChange={handleLayoutChange}
          isResizable={editMode}
          isDraggable={editMode}
          isDroppable={editMode}
        >
          {Object.entries(input.objects).map(([key, value]) => {
            return (
              <Paper key={key} sx={{ position: "relative" }}>
                <ComponentMenu />
                <RenderedComponent value={value} />
              </Paper>
            );
          })}
        </GridLayout>
      </Box>
    </ComponentsContext.Provider>
  );
}
