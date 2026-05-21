import "./globals.css";

export const metadata = {
  title: "NeoCrew QA",
  description: "Capture bugs and features. Ship with confidence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
