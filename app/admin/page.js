"use client";

import { useCallback, useEffect, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";

const EMPTY_FORM = { name: "", categoryId: "", brand: "", specs: "", notes: "" };

export default function AdminPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  // Category management
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catError, setCatError] = useState("");

  // Success toast
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  async function loadCategories() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  // Filter products by category and search query
  const visibleProducts = products.filter((p) => {
    const matchesCategory = filterCategoryId
      ? String(p.categoryId) === String(filterCategoryId)
      : true;
    const matchesSearch = searchQuery.trim()
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  // --- Category management ---
  async function addCategory(e) {
    e.preventDefault();
    setCatError("");
    if (!newCategoryName.trim()) return setCatError("Enter a category name.");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setCatError(data.error || "Failed to add category.");
    }
    setNewCategoryName("");
    loadCategories();
    showToast(`Category "${newCategoryName.trim()}" added`);
  }

  async function removeCategory(id, name) {
    if (!confirm(`Delete category "${name}"?`)) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setCatError(data.error || "Failed to delete category.");
    }
    setCatError("");
    loadCategories();
    showToast(`Category "${name}" deleted`);
  }

  // --- Product management ---
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
    const action = editingId ? "updated" : "added";
    showToast(`Product "${form.name.trim()}" ${action}`);
    cancelEdit();
    loadProducts();
  }

  async function remove(id, name) {
    if (!confirm("Delete this product? Saved quotations are not affected.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    loadProducts();
    showToast(`Product "${name}" deleted`);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Inventory</h1>

      {/* ---- Toast ---- */}
      {toast && (
        <div className="toast fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* ---- Category Management ---- */}
      <div className="card p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Categories</h2>
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            className="input max-w-xs"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>
        {catError && <p className="text-red-600 text-sm">{catError}</p>}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="pill">
              {c.name}
              <button
                onClick={() => removeCategory(c.id, c.name)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-150"
                title={`Delete ${c.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* ---- Add / Edit Product ---- */}
      <form
        onSubmit={submit}
        className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <SearchableSelect
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={form.categoryId}
          onChange={(val) => setForm({ ...form, categoryId: val })}
          placeholder="Category *"
        />
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

      {/* ---- Filter & Search ---- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-[220px]">
          <SearchableSelect
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={filterCategoryId}
            onChange={setFilterCategoryId}
            placeholder="Select a category to view"
          />
        </div>
        {filterCategoryId && (
          <>
            <div className="relative">
              <input
                className="input max-w-xs pl-8"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {visibleProducts.length} product{visibleProducts.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* ---- Product Table ---- */}
      {filterCategoryId ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Specs</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-300 text-sm">
                    {searchQuery ? "No products match your search." : "No products in this category."}
                  </td>
                </tr>
              )}
              {visibleProducts.map((p) => (
                <tr key={p.id} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.brand}</td>
                  <td className="px-4 py-3 text-gray-400">{p.specs}</td>
                  <td className="px-4 py-3 text-gray-400">{p.notes}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(p)} className="action-link-blue mr-3">
                      Edit
                    </button>
                    <button onClick={() => remove(p.id, p.name)} className="action-link-red">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">
          Select a category above to view its products.
        </p>
      )}
    </div>
  );
}
