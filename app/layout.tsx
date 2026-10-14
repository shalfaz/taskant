import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskAnt | Small Tasks. Big Impact.",
  description:
    "Connect with trusted local helpers to get your tasks done across Bangladesh.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
