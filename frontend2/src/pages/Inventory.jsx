import React, { useEffect, useState } from "react";
import InventoryList from "../components/inventory/InventoryList";
import AddIngredientForm from "../components/inventory/AddIngredientForm";

export default function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/inventory");
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error("Error loading ingredients:", error);
    }
    setLoading(false);
  };

  const handleAddIngredient = async (ingredient) => {
    // הדפסת בדיקה לראות מה נשלח ל-Backend
    console.log("📤 Sending ingredient to backend:", ingredient);

    try {
      const response = await fetch("http://localhost:5000/api/inventory/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ingredient),
      });

      const newItem = await response.json();
      console.log("✅ Received from backend:", newItem);  // בדיקה מה חזר מהשרת

      setIngredients((prev) => [...prev, newItem]);
      setShowAddForm(false);
    } catch (error) {
      console.error("❌ Error adding ingredient:", error);
    }
};


  const handleUpdateIngredient = async (id, updates) => {
    try {
      await fetch(`http://localhost:5000/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      loadIngredients();
    } catch (error) {
      console.error("Error updating ingredient:", error);
    }
  };

  const handleDeleteIngredient = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/inventory/${id}`, {
        method: "DELETE",
      });
      loadIngredients();
    } catch (error) {
      console.error("Error deleting ingredient:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🧺 My Inventory</h1>

      <button onClick={() => setShowAddForm(true)} style={{ marginBottom: "10px" }}>
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
