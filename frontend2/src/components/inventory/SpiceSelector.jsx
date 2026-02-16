import { API_BASE } from "../../utils/api";
import React, { useEffect, useState } from "react";

const ALL_SPICES = [
  "Salt", "Black Pepper", "Paprika", "Cumin", "Coriander",
  "Turmeric", "Oregano", "Basil", "Garlic Powder", "Onion Powder",
  "Cinnamon", "Chili Flakes", "Thyme", "Rosemary", "Curry Powder"
];

export default function SpiceSelector({ }) {
  const token = localStorage.getItem("token");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchUserSpices();
  }, []);

  const fetchUserSpices = async () => {
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/spices/list`, {
        headers: { 'Authorization': `Bearer ${currentToken}` } // הוספת המפתח
      });
      if (!res.ok) throw new Error("Failed to fetch spices");
      const data = await res.json();
      setSelected(data); // ✅ רק שמות
    } catch (err) {
      console.error("❌ Error loading spices:", err);
    }
  };

  const toggleSpice = async (spice) => {
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/spices/toggle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" ,
          "Authorization": `Bearer ${currentToken}` // מוסיפים את המפתח כאן
    },
        body: JSON.stringify({
          spice_name: spice,
        }),
      });

      if (!res.ok) throw new Error("Toggle failed");

      setSelected(prev =>
        prev.includes(spice)
          ? prev.filter(s => s !== spice)
          : [...prev, spice]
      );
    } catch (err) {
      console.error("❌ Error toggling spice:", err);
    }
  };

  return (
    <div className="border p-4 rounded bg-white shadow-sm">
      <h3 className="text-lg font-bold mb-2">🧂 What spices do you have?</h3>
      <div className="flex flex-wrap gap-2">
        {ALL_SPICES.map((spice) => (
          <button
            key={spice}
            onClick={() => toggleSpice(spice)}
            className={`px-3 py-1 rounded border ${
              selected.includes(spice)
                ? "bg-yellow-300 border-yellow-500"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {spice}
          </button>
        ))}
      </div>
    </div>
  );
}
