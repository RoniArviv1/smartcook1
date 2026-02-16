import { API_BASE } from "../../utils/api";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AddIngredientForm from "./AddIngredientForm";

export default function InventoryAddPage() {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const navigate = useNavigate();
  const nameFromScan = location.state?.name || "";
  const barcodeFromScan = location.state?.barcode || "";

  const handleSubmit = async (ingredient) => {
    const currentToken = localStorage.getItem("token");
    

    try {
      const res = await fetch(`${API_BASE}/api/inventory`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" ,
          "Authorization": `Bearer ${currentToken}` // מוסיפים את המפתח כאן
    },
        body: JSON.stringify({ ...ingredient, barcode: barcodeFromScan })
      });

      if (!res.ok) throw new Error("Failed to add product");
      navigate("/inventory");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">➕ Add Product to Inventory</h1>
      <AddIngredientForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/inventory")}
        prefillName={nameFromScan}
      />
    </div>
  );
}
