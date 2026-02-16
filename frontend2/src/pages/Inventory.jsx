import { API_BASE } from "../utils/api";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InventoryList from "../components/inventory/InventoryList";
import AddIngredientForm from "../components/inventory/AddIngredientForm";
import SpiceSelector from "../components/inventory/SpiceSelector";

export default function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  
  const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
  const userId = storedUser.user_id;

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    const currentToken = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
      if (!res.ok) throw new Error(`GET inventory failed: ${res.status}`);
      const data = await res.json();
      setIngredients(data.inventory || []);
    } catch (error) {
      console.error("❌ Error loading ingredients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (ingredient) => {
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/inventory`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" ,
           "Authorization": `Bearer ${currentToken}` // מוסיפים את המפתח כאן
        },
        body: JSON.stringify(ingredient),
      });

      if (!res.ok) throw new Error(`POST failed: ${res.status}`);
      await loadIngredients();
      setShowAddForm(false);
    } catch (error) {
      console.error("❌ Error adding ingredient:", error);
    }
  };

  const handleUpdateIngredient = async (id, updates) => {
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" ,
           "Authorization": `Bearer ${currentToken}` // מוסיפים את המפתח כאן
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
      loadIngredients();
    } catch (error) {
      console.error("❌ Error updating ingredient:", error);
    }
  };

  const handleDeleteIngredient = async (id) => {
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "DELETE",
        headers: { 
      "Authorization": `Bearer ${currentToken}` // מוסיפים את המפתח כאן
    },
      });
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      loadIngredients();
    } catch (error) {
      console.error("❌ Error deleting ingredient:", error);
    }
  };

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
          onClick={() => navigate("/scan")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📷 Scan Barcode
        </button>
      </div>

      {/* קומפוננטת בחירת תבלינים */}
      <SpiceSelector userId={userId} />

      {showAddForm && (
        <AddIngredientForm
          onSubmit={handleAddIngredient}
          onCancel={() => setShowAddForm(false)}
          existingItems={ingredients}
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
