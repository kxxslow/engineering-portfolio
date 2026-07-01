import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Support Review Console",
  description: "Grounded support review operations workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
