import "./globals.css";

export const metadata = {
  title: "NeoCrew QA Tool",
  description: "Capture bugs and features, share with your dev team",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="m-0 p-0 bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
