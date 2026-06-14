"use client";

import { useEffect, useRef, useState } from "react";

export default function SearchableSelect({ options, value, onChange, placeholder, displayKey = "label", valueKey = "value" }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected option label
  const selected = options.find((o) => String(o[valueKey]) === String(value));

  // Filter options by query
  const filtered = query.trim()
    ? options.filter((o) => o[displayKey].toLowerCase().includes(query.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(opt) {
    onChange(String(opt[valueKey]));
    setIsOpen(false);
    setQuery("");
  }

  function handleInputFocus() {
    setIsOpen(true);
    setQuery("");
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className="input flex items-center cursor-pointer gap-1"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 outline-none bg-transparent text-sm"
            placeholder={`Search ${placeholder || ""}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
            {selected ? selected[displayKey] : placeholder || "Select…"}
          </span>
        )}
        {value && !isOpen && (
          <button
            onClick={handleClear}
            className="text-gray-300 hover:text-gray-500 transition-colors duration-150 text-xs"
            title="Clear"
          >
            ✕
          </button>
        )}
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">No results</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt[valueKey]}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors duration-100
                ${String(opt[valueKey]) === String(value)
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-50 text-gray-700"
                }`}
              onClick={() => handleSelect(opt)}
            >
              {opt[displayKey]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
