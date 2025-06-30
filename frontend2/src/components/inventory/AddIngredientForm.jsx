import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CATEGORIES = ["produce", "meat", "dairy", "pantry", "spices", "frozen", "other"];

export default function AddIngredientForm({ onSubmit, onCancel, existingItems = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { name = "", barcode = "" } = location.state || {};

  const [form, setForm] = useState({
    name,
    quantity: "",
    unit: "",
    expiration_date: "",
    barcode
  });

  const [allowedUnits, setAllowedUnits] = useState([]);

  // 🌀 שליפת יחידות מתאימות מהשרת
  useEffect(() => {
    const fetchAllowedUnits = async () => {
      if (!form.name.trim()) {
        setAllowedUnits([]);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/ingredient/units?name=${encodeURIComponent(form.name)}`);;
        if (!res.ok) throw new Error("Failed to fetch allowed units");
        const data = await res.json();
        setAllowedUnits(data.units || []);
      } catch (err) {
        console.error("❌ Error fetching units:", err);
        setAllowedUnits([]);
      }
    };

    fetchAllowedUnits();
  }, [form.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛑 ולידציה – האם היחידה תקפה
    if (!allowedUnits.includes(form.unit)) {
      alert(`Unit "${form.unit}" is not valid for "${form.name}". Please choose a correct unit.`);
      return;
    }

    // ✅ שליחה
    await onSubmit({
      ...form,
      quantity: parseFloat(form.quantity)
    });
    navigate("/inventory");
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
            onChange={(e) => {
              const newName = e.target.value;
              setForm({ ...form, name: newName, unit: "" }); // איפוס היחידה
            }}
            required
            style={{ width: "100%", padding: "6px" }}
            placeholder="Ingredient name"
          />
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
              disabled={!form.name.trim()}
              style={{ width: "120px", padding: "6px" }}
            >
              <option value="">Unit</option>
              {allowedUnits.map((unit) => (
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
        <button type="button" onClick={onCancel || (() => navigate("/inventory"))} style={{ padding: "8px 12px" }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: "8px 12px", backgroundColor: "#f97316", color: "white", border: "none", borderRadius: "4px" }}>
          Add Ingredient
        </button>
      </div>
    </form>
  );
}
