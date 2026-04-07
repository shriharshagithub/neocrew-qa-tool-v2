export const metadata = {
  title: "NeoCrew QA Tool",
  description: "Capture screenshots and share test reports",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
