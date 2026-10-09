import "./globals.css";
export const metadata = {
  title: "Precious, with love | An eighteenth birthday keepsake",
  description: "A private, personal birthday story made with love.",
  robots: { index: false, follow: false },
};
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
