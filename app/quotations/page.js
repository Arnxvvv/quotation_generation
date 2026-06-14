"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadQuotations() {
    const res = await fetch("/api/quotations");
    setQuotations(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadQuotations();
  }, []);

  async function remove(id, refNumber) {
    if (!confirm(`Delete quotation ${refNumber}? This cannot be undone.`)) return;
    await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    loadQuotations();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Quotations</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3">Ref No.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-300 text-sm">
                    No quotations yet.
                  </td>
                </tr>
              )}
              {quotations.map((q) => (
                <tr key={q.id} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-medium">{q.refNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(q.quotationDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINR(q.grandTotal)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link className="action-link-blue mr-3" href={`/quotations/${q.id}`}>
                      View
                    </Link>
                    <button
                      onClick={() => remove(q.id, q.refNumber)}
                      className="action-link-red"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
