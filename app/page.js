"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";

export default function BuilderPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [items, setItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(null);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const categoryProducts = useMemo(
    () => products.filter((p) => String(p.categoryId) === String(categoryId)),
    [products, categoryId]
  );

  function addItem() {
    setError("");
    const product = products.find((p) => String(p.id) === String(productId));
    const unitPrice = parseFloat(price);
    const quantity = parseInt(qty, 10);
    if (!product) return setError("Select a category and product.");
    if (!unitPrice || unitPrice <= 0) return setError("Enter a valid selling price.");
    if (!quantity || quantity <= 0) return setError("Enter a valid quantity.");
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
    setProductId("");
    setPrice("");
    setQty("1");
    setGrandTotal(null);
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
    setGrandTotal(null);
  }

  function generateTotal() {
    setGrandTotal(items.reduce((sum, it) => sum + it.lineTotal, 0));
  }

  async function saveQuotation() {
    setError("");
    if (!customer.name.trim() || !customer.phone.trim())
      return setError("Customer name and phone are required.");
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
    <div className="space-y-6">
      <h1 className="text-xl font-bold">New Quotation</h1>

      <div className="bg-white border border-gray-200 rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          className="input"
          placeholder="Customer name *"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Phone *"
          value={customer.phone}
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
        />
        <input
          className="input"
          placeholder="Email (optional)"
          value={customer.email}
          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
        />
        <input
          className="input"
          type="date"
          value={customer.date}
          onChange={(e) => setCustomer({ ...customer, date: e.target.value })}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <select
          className="input"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setProductId("");
          }}
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Product</option>
          {categoryProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand ? p.brand + " " : ""}
              {p.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Selling price (\u20b9)"
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
        <button onClick={addItem} className="btn-primary">
          Add to Build
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-2">Category</th>
              <th className="p-2">Component</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400">
                  No components added yet.
                </td>
              </tr>
            )}
            {items.map((it, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="p-2">{it.categoryName}</td>
                <td className="p-2 font-medium">
                  {it.brand ? it.brand + " " : ""}
                  {it.productName}
                </td>
                <td className="p-2 text-right">{formatINR(it.unitPrice)}</td>
                <td className="p-2 text-center">{it.quantity}</td>
                <td className="p-2 text-right">{formatINR(it.lineTotal)}</td>
                <td className="p-2 text-center">
                  <button onClick={() => removeItem(i)} className="text-red-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={generateTotal} className="btn-secondary">
          Generate Total
        </button>
        {grandTotal !== null && (
          <span className="text-lg font-bold">Grand Total: {formatINR(grandTotal)}</span>
        )}
        <button onClick={saveQuotation} disabled={saving} className="btn-primary ml-auto">
          {saving ? "Saving..." : "Save Quotation"}
        </button>
      </div>
    </div>
  );
}
