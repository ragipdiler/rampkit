import type { Metadata } from "next";
import "@fontsource-variable/google-sans-flex/wght.css";
import "./globals.css";
import "./art.css";
import "./compact.css";
import "./classic-palette.css";
export const metadata: Metadata = {
  title: "Rampkit",
  description: "Build a color system around the colors you choose.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (/Android|Windows/i.test(navigator.userAgent)) document.documentElement.dataset.platformFont = 'google';`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
