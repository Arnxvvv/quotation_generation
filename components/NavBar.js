"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Builder" },
  { href: "/word-quotation", label: "Word Export" },
  { href: "/quotations", label: "Quotations" },
  { href: "/admin", label: "Inventory" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="no-print bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-8">
        <span className="font-semibold text-sm tracking-tight">PC Quotations</span>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-1.5 rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
