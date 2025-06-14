import React, { useState } from "react";

const CATEGORIES = ["produce", "meat", "dairy", "pantry", "spices", "frozen", "other"];
const UNITS = ["grams", "kg", "ml", "l", "pieces", "cups", "tbsp", "tsp"];

export default function AddIngredientForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    expiration_date: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      quantity: parseFloat(form.quantity)
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
      <h3 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Add New Ingredient</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Name */}
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ width: "100%", padding: "6px" }}
            placeholder="Ingredient name"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            style={{ width: "100%", padding: "6px" }}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity + Unit */}
        <div>
          <label htmlFor="quantity">Quantity</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="quantity"
              type="number"
              min="0"
              step="any"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              placeholder="Amount"
              style={{ flex: 1, padding: "6px" }}
            />
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              required
              style={{ width: "120px", padding: "6px" }}
            >
              <option value="">Unit</option>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="expiration_date">Expiry Date</label>
          <input
            id="expiration_date"
            type="date"
            value={form.expiration_date}
            onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
            style={{ width: "100%", padding: "6px" }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button type="button" onClick={onCancel} style={{ padding: "8px 12px" }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: "8px 12px", backgroundColor: "#f97316", color: "white", border: "none", borderRadius: "4px" }}>
          Add Ingredient
        </button>
      </div>
    </form>
  );
}