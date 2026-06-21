"use client";

import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";

export default function WordQuotationPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [items, setItems] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch(() => setError("Failed to load data. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const categoryProducts = useMemo(
    () => products.filter((p) => String(p.categoryId) === String(categoryId)),
    [products, categoryId]
  );

  // GST calculations
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.priceWithGst / 1.18) * it.qty, 0),
    [items]
  );
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal * 1.18;

  function formatINR(val) {
    return (
      "\u20b9" +
      Number(val || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function addItem() {
    setError("");
    const product = products.find((p) => String(p.id) === String(productId));
    const priceVal = parseFloat(price);
    const qtyVal = parseInt(qty, 10);
    if (!product) return setError("Select a category and product.");
    if (!priceVal || priceVal <= 0) return setError("Enter a valid price (with GST).");
    if (!qtyVal || qtyVal <= 0) return setError("Enter a valid quantity.");

    // Check for duplicate
    const existingIndex = items.findIndex(
      (it) => it.productId === product.id && it.priceWithGst === priceVal
    );

    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].qty += qtyVal;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          name: product.name,
          description: description.trim(),
          qty: qtyVal,
          priceWithGst: priceVal,
        },
      ]);
    }

    setProductId("");
    setDescription("");
    setPrice("");
    setQty("1");
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function generateDocx() {
    setError("");
    if (items.length === 0) return setError("Add at least one item.");
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, companyName: companyName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Generate Word Quotation</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Build a quotation and download it as a Word document with your company letterhead.
          Prices entered are <strong>with GST (18%)</strong> — the document auto-calculates the breakup.
        </p>
      </div>

      {/* Company Name */}
      <div className="card p-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Company / Client Name (for the quotation &ldquo;To&rdquo; field)</label>
        <input
          className="input max-w-md"
          placeholder="e.g. Alliance Associates"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      {/* Add item row */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <SearchableSelect
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId}
          onChange={(val) => {
            setCategoryId(val);
            setProductId("");
          }}
          placeholder={loading ? "Loading…" : "Category"}
        />
        <SearchableSelect
          options={categoryProducts.map((p) => ({
            value: p.id,
            label: (p.brand ? p.brand + " " : "") + p.name,
          }))}
          value={productId}
          onChange={setProductId}
          placeholder={loading ? "Loading…" : categoryId ? "Product" : "Select category first"}
        />
        <input
          className="input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Price with GST (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          className="input"
          type="number"
          min="1"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <button onClick={addItem} disabled={loading} className="btn-primary">
          Add Item
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Items table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">Price (with GST)</th>
              <th className="px-4 py-3 text-right">Unit Price (excl)</th>
              <th className="px-4 py-3 text-right">Total (excl)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-300 text-sm">
                  No items added yet.
                </td>
              </tr>
            )}
            {items.map((it, i) => {
              const excl = it.priceWithGst / 1.18;
              const lineTotal = excl * it.qty;
              return (
                <tr key={i} className="border-t border-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{it.name}</td>
                  <td className="px-4 py-3 text-gray-500">{it.description || "—"}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{it.qty}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-400">{formatINR(it.priceWithGst)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(excl)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINR(lineTotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => removeItem(i)} className="action-link-red">
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GST Summary & Download */}
      {items.length > 0 && (
        <div className="card p-4 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1 text-sm tabular-nums">
            <div className="flex justify-between gap-8">
              <span className="text-gray-500">Sub Total (excl. GST)</span>
              <span className="font-medium">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-gray-500">CGST @ 9%</span>
              <span>{formatINR(cgst)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-gray-500">SGST @ 9%</span>
              <span>{formatINR(sgst)}</span>
            </div>
            <div className="flex justify-between gap-8 pt-1 border-t border-gray-100">
              <span className="font-semibold">Grand Total (incl. 18% GST)</span>
              <span className="font-semibold text-base">{formatINR(grandTotal)}</span>
            </div>
          </div>
          <button
            onClick={generateDocx}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? "Generating…" : "Download Word Quotation"}
          </button>
        </div>
      )}
    </div>
  );
}
