// src/app/layout.tsx
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { MuiSetup } from "./MuiSetup";
import Providers from "./providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";

export const metadata: Metadata = {
  title: "My title",
  description: "My description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <Providers>
              <MuiSetup>{children}</MuiSetup>
            </Providers>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
