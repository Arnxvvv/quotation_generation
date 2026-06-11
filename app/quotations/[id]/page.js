import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import PrintButton from "@/components/PrintButton";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({ params }) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(params.id) },
    include: { items: true },
  });
  if (!quotation) notFound();

  return (
    <div className="space-y-6 bg-white border border-gray-200 rounded p-6 print:border-0 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Quotation {quotation.refNumber}</h1>
          <p className="text-sm text-gray-500">
            Date: {new Date(quotation.quotationDate).toLocaleDateString("en-IN")}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="text-sm space-y-1">
        <p>
          <span className="font-medium">Customer:</span> {quotation.customerName}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {quotation.customerPhone}
        </p>
        {quotation.customerEmail && (
          <p>
            <span className="font-medium">Email:</span> {quotation.customerEmail}
          </p>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-300 text-gray-500">
            <th className="p-2">#</th>
            <th className="p-2">Category</th>
            <th className="p-2">Component</th>
            <th className="p-2 text-right">Unit Price</th>
            <th className="p-2 text-center">Qty</th>
            <th className="p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((it, i) => (
            <tr key={it.id} className="border-b border-gray-100">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{it.categorySnapshot}</td>
              <td className="p-2">
                {it.brandSnapshot ? it.brandSnapshot + " " : ""}
                {it.productNameSnapshot}
              </td>
              <td className="p-2 text-right">{formatINR(it.unitPrice)}</td>
              <td className="p-2 text-center">{it.quantity}</td>
              <td className="p-2 text-right">{formatINR(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="p-2 text-right font-bold">
              Grand Total
            </td>
            <td className="p-2 text-right font-bold">{formatINR(quotation.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
