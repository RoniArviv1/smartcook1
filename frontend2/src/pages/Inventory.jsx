// src/pages/Inventory.jsx
import React, { useEffect, useState } from "react";
import InventoryList from "../components/inventory/InventoryList";
import AddIngredientForm from "../components/inventory/AddIngredientForm";

export default function Inventory() {
  /** ------------------------------------------------------------------ */
  /**                           הגדרות STATE                            */
  /** ------------------------------------------------------------------ */
  const [ingredients, setIngredients] = useState([]);  // [{id,name,...}, ...]
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ① חילוץ user_id  (מ-localStorage או קבוע לפיתוח) */
  const storedUser =
    JSON.parse(localStorage.getItem("smartcookUser") || "{}") || {};
  const userId =  storedUser.user_id || storedUser.id || 1;;   // fallback ל-1 בזמן פיתוח

  /** ------------------------------------------------------------------ */
  /**                   טעינת מלאי מה-Backend                            */
  /** ------------------------------------------------------------------ */
  useEffect(() => {
    loadIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/inventory/${userId}`
      );
      if (!res.ok)
        throw new Error(`GET inventory failed: ${res.status}`);

      const data = await res.json();           // { inventory: [...] }
      setIngredients(data.inventory || []);
    } catch (error) {
      console.error("❌ Error loading ingredients:", error);
    } finally {
      setLoading(false);
    }
  };

  /** ------------------------------------------------------------------ */
  /**                     הוספת פריט חדש                                 */
  /** ------------------------------------------------------------------ */
  const handleAddIngredient = async (ingredient) => {
    console.log("📤 Sending ingredient to backend:", {
      ...ingredient,
      user_id: userId
    });
    try {
      const res = await fetch(
        `http://localhost:5000/api/inventory/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ingredient),
        }
      );
      if (!res.ok)
        throw new Error(`POST failed: ${res.status}`);

      const newItem = await res.json();   // הפריט שחוזר מה-Backend
      console.log("✅ Received from backend:", newItem);

      setIngredients((prev) => [...prev, newItem]);
      setShowAddForm(false);
    } catch (error) {
      console.error("❌ Error adding ingredient:", error);
    }
  };

  /** ------------------------------------------------------------------ */
  /**                   עדכון / מחיקה                                    */
  /** ------------------------------------------------------------------ */
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
      if (!res.ok)
        throw new Error(`PUT failed: ${res.status}`);
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
      if (!res.ok)
        throw new Error(`DELETE failed: ${res.status}`);
      loadIngredients();
    } catch (error) {
      console.error("❌ Error deleting ingredient:", error);
    }
  };

  /** ------------------------------------------------------------------ */
  /**                             Render                                 */
  /** ------------------------------------------------------------------ */
  return (
    <div style={{ padding: 20 }}>
      <h1>🧺 My Inventory</h1>

      <button
        onClick={() => setShowAddForm(true)}
        style={{ marginBottom: 10 }}
      >
        ➕ Add Ingredient
      </button>

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