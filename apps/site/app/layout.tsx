import type { Metadata } from "next";
import "@fontsource-variable/google-sans-flex/wght.css";
import "../../web/app/classic-palette.css";
import "./site.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rampkit-studio.vercel.app"),
  title: "Rampkit — Local-first color system builder",
  description:
    "Extract website colors, build OKLCH palettes, explore pigment mixing, and export light and dark design tokens. Open source, local-first, and free to use.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Rampkit — Local-first color system builder",
    description:
      "Extract colors, build OKLCH palettes, and export light and dark design tokens.",
    url: "/",
    siteName: "Rampkit",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/social.png",
        width: 1200,
        height: 630,
        alt: "Rampkit: Turn website colors into production-ready color systems.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rampkit — Local-first color system builder",
    images: ["/social.png"],
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if (/Android|Windows/i.test(navigator.userAgent)) document.documentElement.dataset.platformFont = 'google';",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
