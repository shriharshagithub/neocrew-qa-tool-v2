import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata = {
  title: "NeoCrew QA",
  description: "Capture bugs and features. Ship with confidence.",
  themeColor: "#010102",
  applicationName: "NeoCrew QA",
  openGraph: {
    title: "NeoCrew QA",
    description: "Capture bugs and features. Ship with confidence.",
    siteName: "NeoCrew QA",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
