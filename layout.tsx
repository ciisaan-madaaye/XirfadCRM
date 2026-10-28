import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "XirfadCRM", description: "Maaree macaamiishaada, iibka iyo hawlaha ganacsiga." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="so"><body>{children}</body></html>;
}