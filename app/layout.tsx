import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Precious, with love | An eighteenth birthday keepsake",
  description: "A private, personal birthday story made with love.",
  robots: { index: false, follow: false },
};

// Matches the page canvas so the phone's browser bar blends in; viewportFit lets us respect notches.
export const viewport: Viewport = { themeColor: "#f7f1ee", width: "device-width", initialScale: 1, viewportFit: "cover" };

// Web fonts load from Google Fonts with `display=swap`; if they are blocked the CSS falls back to system serif/sans.
const fonts = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600;700&family=Pinyon+Script&display=swap";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fonts} />
      </head>
      <body>{children}</body>
    </html>
  );
}
