// src/app/layout.tsx
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { MuiSetup } from "./MuiSetup";
import Providers from "./providers";

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
        <Providers>
          <MuiSetup>{children}</MuiSetup>
        </Providers>
      </body>
    </html>
  );
}
