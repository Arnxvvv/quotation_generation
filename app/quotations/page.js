import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Quotations</h1>
      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-2">Ref No.</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Date</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400">
                  No quotations yet.
                </td>
              </tr>
            )}
            {quotations.map((q) => (
              <tr key={q.id} className="border-t border-gray-100">
                <td className="p-2 font-medium">{q.refNumber}</td>
                <td className="p-2">{q.customerName}</td>
                <td className="p-2">{q.customerPhone}</td>
                <td className="p-2">{new Date(q.quotationDate).toLocaleDateString("en-IN")}</td>
                <td className="p-2 text-right">{formatINR(q.grandTotal)}</td>
                <td className="p-2 text-right">
                  <Link className="text-blue-600 hover:underline" href={`/quotations/${q.id}`}>
                    View / Print
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
