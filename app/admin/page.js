"use client";

import { useEffect, useState } from "react";

const EMPTY_FORM = { name: "", categoryId: "", brand: "", specs: "", notes: "" };

export default function AdminPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    loadProducts();
  }, []);

  const visibleProducts = filterCategoryId
    ? products.filter((p) => String(p.categoryId) === String(filterCategoryId))
    : products;

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: String(p.categoryId),
      brand: p.brand || "",
      specs: p.specs || "",
      notes: p.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.categoryId)
      return setError("Product name and category are required.");
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error || "Failed to save product.");
    }
    cancelEdit();
    loadProducts();
  }

  async function remove(id) {
    if (!confirm("Delete this product? Saved quotations are not affected.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    loadProducts();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Inventory</h1>

      <form
        onSubmit={submit}
        className="bg-white border border-gray-200 rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <select
          className="input"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">Category *</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Product name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Brand"
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
        />
        <input
          className="input"
          placeholder="Specifications (optional)"
          value={form.specs}
          onChange={(e) => setForm({ ...form, specs: e.target.value })}
        />
        <input
          className="input"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {editingId ? "Update Product" : "Add Product"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Filter:</label>
        <select
          className="input max-w-xs"
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-2">Category</th>
              <th className="p-2">Name</th>
              <th className="p-2">Brand</th>
              <th className="p-2">Specs</th>
              <th className="p-2">Notes</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400">
                  No products.
                </td>
              </tr>
            )}
            {visibleProducts.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="p-2">{p.category?.name}</td>
                <td className="p-2 font-medium">{p.name}</td>
                <td className="p-2">{p.brand}</td>
                <td className="p-2 text-gray-500">{p.specs}</td>
                <td className="p-2 text-gray-500">{p.notes}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline mr-3">
                    Edit
                  </button>
                  <button onClick={() => remove(p.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
