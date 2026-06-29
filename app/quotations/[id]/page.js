import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import PrintButton from "@/components/PrintButton";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({ params }) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  });
  if (!quotation) notFound();

  return (
    <div className="card p-6 space-y-6 print:shadow-none print:border-0 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Quotation {quotation.refNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(quotation.quotationDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <PrintButton />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-200">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Component</th>
            <th className="px-4 py-3 text-right">Unit Price</th>
            <th className="px-4 py-3 text-center">Qty</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((it, i) => (
            <tr key={it.id} className="border-b border-gray-50">
              <td className="px-4 py-3 text-gray-400">{i + 1}</td>
              <td className="px-4 py-3 text-gray-500">{it.categorySnapshot}</td>
              <td className="px-4 py-3 font-medium">
                {it.brandSnapshot ? it.brandSnapshot + " " : ""}
                {it.productNameSnapshot}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{formatINR(it.unitPrice)}</td>
              <td className="px-4 py-3 text-center tabular-nums">{it.quantity}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINR(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200">
            <td colSpan="5" className="px-4 py-3 text-right font-semibold">
              Grand Total
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-base">
              {formatINR(quotation.grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
