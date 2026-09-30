import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ExamSecure",
  description: "Secure online examination platform",
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
