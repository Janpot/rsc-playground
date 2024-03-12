import React from "react";
import { CircularProgress, Typography, styled } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

export const CardSurface = styled("div")(({ theme }) => ({
  position: "relative",
  backgroundColor: theme.palette.background.paper,
  borderColor: theme.palette.divider,
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: theme.shape.borderRadius,
}));

const OverlayRoot = styled("div")(({ theme }) => ({
  position: "absolute",
  inset: "0 0 0 0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}));

export interface ErrorOverlayProps {
  error?: unknown;
}

export function ErrorOverlay({ error }: ErrorOverlayProps) {
  return (
    <OverlayRoot>
      <Typography
        variant="h6"
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1,
          alignItems: "center",
        }}
      >
        <ErrorIcon color="error" /> Error
      </Typography>
      <Typography textAlign="center">
        {(error as any)?.message ?? "Unknown error"}
      </Typography>
    </OverlayRoot>
  );
}

export function LoadingOverlay() {
  return (
    <OverlayRoot>
      <CircularProgress />
    </OverlayRoot>
  );
}
