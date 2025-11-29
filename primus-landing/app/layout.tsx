import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Primus Insights Roofing | AI-Powered Lead Automation",
  description: "Turn roof inspection requests into booked appointments automatically. Powered by Primus OS.",
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
