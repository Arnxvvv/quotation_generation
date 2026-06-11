import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "PC Quotation Builder",
  description: "Build custom PC quotations from your own inventory",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="no-print bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
            <span className="font-bold">PC Quotations</span>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Builder
            </Link>
            <Link href="/quotations" className="text-sm text-gray-600 hover:text-gray-900">
              Quotations
            </Link>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              Inventory
            </Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
