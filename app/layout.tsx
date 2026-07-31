import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Travel Magnets", template: "%s | Travel Magnets" },
  description: "Albumes audiovisuales de viajes para imanes NFC.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
