"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import SearchableSelect from "@/components/SearchableSelect";

export default function BuilderPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const grandTotal = useMemo(
    () => items.reduce((sum, it) => sum + it.lineTotal, 0),
    [items]
  );

  function addItem() {
    setError("");
    const product = products.find((p) => String(p.id) === String(productId));
    const unitPrice = parseFloat(price);
    const quantity = parseInt(qty, 10);
    if (!product) return setError("Select a category and product.");
    if (!unitPrice || unitPrice <= 0) return setError("Enter a valid selling price.");
    if (!quantity || quantity <= 0) return setError("Enter a valid quantity.");

    // Check for duplicate — same product and same price → bump quantity
    const existingIndex = items.findIndex(
      (it) => it.productId === product.id && it.unitPrice === unitPrice
    );

    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
        lineTotal: (updated[existingIndex].quantity + quantity) * unitPrice,
      };
      setItems(updated);
    } else {
      const category = categories.find((c) => c.id === product.categoryId);
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          brand: product.brand || "",
          categoryName: category ? category.name : "",
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity,
        },
      ]);
    }

    setProductId("");
    setPrice("");
    setQty("1");
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function saveQuotation() {
    setError("");
    if (items.length === 0) return setError("Add at least one component.");
    setSaving(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save quotation.");
      router.push(`/quotations/${data.id}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">New Quotation</h1>

      {/* Add component row */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
          type="number"
          min="0"
          placeholder="Selling price (₹)"
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
          Add to Build
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Items table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Component</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-300 text-sm">
                  No components added yet.
                </td>
              </tr>
            )}
            {items.map((it, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td className="px-4 py-3 text-gray-500">{it.categoryName}</td>
                <td className="px-4 py-3 font-medium">
                  {it.brand ? it.brand + " " : ""}
                  {it.productName}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(it.unitPrice)}</td>
                <td className="px-4 py-3 text-center tabular-nums">{it.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINR(it.lineTotal)}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => removeItem(i)} className="action-link-red">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {items.length > 0 && (
            <span className="text-lg font-semibold tabular-nums">
              Grand Total: {formatINR(grandTotal)}
            </span>
          )}
        </div>
        <button onClick={saveQuotation} disabled={saving || items.length === 0} className="btn-primary">
          {saving ? "Saving…" : "Save Quotation"}
        </button>
      </div>
    </div>
  );
}
