import React, { useEffect, useState } from "react";
import InventoryList from "../components/inventory/InventoryList";
import AddIngredientForm from "../components/inventory/AddIngredientForm";
import ScanModal from "../components/inventory/ScanModal";

export default function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scannedProduct, setScannedProduct] = useState(null);

  const storedUser =
    JSON.parse(localStorage.getItem("smartcookUser") || "{}") || {};
  const userId = storedUser.user_id || storedUser.id || 1;

  // ─────────────── Initial load ───────────────
  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/${userId}`);
      if (!res.ok) throw new Error(`GET inventory failed: ${res.status}`);
      const data = await res.json();
      setIngredients(data.inventory || []);
    } catch (error) {
      console.error("❌ Error loading ingredients:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────── Add new ingredient ───────────────
  const handleAddIngredient = async (ingredient) => {
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ingredient, user_id: userId }),
      });
      if (!res.ok) throw new Error(`POST failed: ${res.status}`);
      const newItem = await res.json();
      setIngredients((prev) => [...prev, newItem]);
      setShowAddForm(false);
    } catch (error) {
      console.error("❌ Error adding ingredient:", error);
    }
  };

  const handleUpdateIngredient = async (id, updates) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/inventory/${userId}/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
      loadIngredients();
    } catch (error) {
      console.error("❌ Error updating ingredient:", error);
    }
  };

  const handleDeleteIngredient = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/inventory/${userId}/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      loadIngredients();
    } catch (error) {
      console.error("❌ Error deleting ingredient:", error);
    }
  };

  // ─────────────── Barcode detection ───────────────
  const handleBarcodeDetected = (barcode) => {
    console.log("✅ Scanned barcode:", barcode);
    setScannedBarcode(barcode);

    const existing = ingredients.find((item) => item.barcode === barcode);
    if (existing) {
      alert("📦 A product with this barcode already exists in your inventory!");
      setScannedProduct(null);
      return;
    }

    setScannedProduct({
      name: "Scanned product",
      barcode,
    });
  };

  const handleConfirmAdd = async () => {
    if (!scannedProduct) return;
    await handleAddIngredient({
      name: scannedProduct.name,
      barcode: scannedProduct.barcode,
      quantity: 1,
      category: "unknown",
    });
    setScannedProduct(null);
    setScannedBarcode("");
  };

  // ─────────────── UI ───────────────
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🧺 My Inventory</h1>

      <div className="flex gap-3">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Add Ingredient
        </button>

        <button
          onClick={() => setIsScanModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📷 Scan Barcode
        </button>
      </div>

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {scannedProduct && (
        <div className="p-4 border rounded bg-gray-100">
          <h4 className="font-bold mb-2">🔍 New product detected:</h4>
          <p><strong>Name:</strong> {scannedProduct.name}</p>
          <p><strong>Barcode:</strong> {scannedProduct.barcode}</p>
          <button
            onClick={handleConfirmAdd}
            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            ➕ Add to Inventory
          </button>
        </div>
      )}

      {showAddForm && (
        <AddIngredientForm
          onSubmit={handleAddIngredient}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <InventoryList
        ingredients={ingredients}
        loading={loading}
        onUpdate={handleUpdateIngredient}
        onDelete={handleDeleteIngredient}
      />
    </div>
  );
}
