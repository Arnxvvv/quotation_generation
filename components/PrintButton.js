"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print border border-gray-300 rounded px-4 py-2 text-sm font-medium bg-white hover:bg-gray-100"
    >
      Print / Save PDF
    </button>
  );
}
