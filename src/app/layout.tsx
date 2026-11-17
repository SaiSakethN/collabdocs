import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CollabDocs — A home for every idea",
  description:
    "Write, share, and move your ideas forward. A collaborative document workspace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
