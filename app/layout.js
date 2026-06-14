import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "PC Quotation Builder",
  description: "Build custom PC quotations from your own inventory",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
        <nav className="no-print bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-8">
            <span className="font-semibold text-sm tracking-tight">PC Quotations</span>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150">
                Builder
              </Link>
              <Link href="/word-quotation" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150">
                Word Export
              </Link>
              <Link href="/quotations" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150">
                Quotations
              </Link>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150">
                Inventory
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
