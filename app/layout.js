import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "PC Quotation Builder",
  description: "Build custom PC quotations from your own inventory",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
