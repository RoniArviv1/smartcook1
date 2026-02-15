import React, { useState } from "react";

export default function ManualEntry({ onDetected }) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const cleaned = barcode.trim();

    if (!cleaned) {
      setError("Please enter a valid barcode");
      return;
    }

    // אפשר להוסיף ולידציה מתקדמת יותר כאן
    if (!/^\d{8,14}$/.test(cleaned)) {
      setError("Barcode must be numeric (8–14 digits)");
      return;
    }

    if (onDetected) onDetected(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Enter the barcode manually"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
      >
        ➕ Add by barcode
      </button>
    </form>
  );
}
