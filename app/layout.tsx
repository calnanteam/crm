import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calnan CRM",
  description: "Internal CRM for Calnan Real Estate Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
