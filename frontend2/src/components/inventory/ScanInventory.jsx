// src/components/inventory/ScanInventory.jsx
import React, { useState } from "react";

export default function ScanInventory() {
  const [imageFile, setImageFile] = useState(null);
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setBarcodeResult(null);
      setError("");
    }
  };

  const handleScan = async () => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const res = await fetch("http://localhost:5000/api/scan/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unknown error");
        setBarcodeResult(null);
      } else {
        setBarcodeResult(data.barcode);
        setError("");
      }
    } catch (err) {
      console.error("Scan failed:", err);
      setError("Scan failed.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-semibold">📷 Scan Product Barcode</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="border p-2 w-full"
      />

      <button
        onClick={handleScan}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Scan Barcode
      </button>

      {barcodeResult && (
        <div className="text-green-600 font-bold">✅ Barcode: {barcodeResult}</div>
      )}

      {error && (
        <div className="text-red-500">❌ {error}</div>
      )}
    </div>
  );
}
