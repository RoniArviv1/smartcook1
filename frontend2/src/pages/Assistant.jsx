import React, { useEffect, useState } from "react";
import KitchenAssistant from "../components/assistant/KitchenAssistant";

export default function Assistant() {
  const [inventory, setInventory] = useState([]);
  const [userPrefs, setUserPrefs] = useState({});
  const [userName] = useState("SmartCook User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.warn("🔧 Using fallback inventory & prefs (no server)");

      // נתונים מדומים
      setInventory([
        { id: 1, name: "Milk", quantity: 1, expiry_date: "2025-04-20" },
        { id: 2, name: "Tomato", quantity: 3, expiry_date: "2025-04-22" }
      ]);

      setUserPrefs({
        vegetarian: true,
        allergies: ["nuts"]
      });
    } catch (err) {
      console.error("Error loading mock data:", err);
    }
    setLoading(false);
  };

  const onSendMessage = async (message, history) => {
    try {
      const ingredientsList = inventory.map(item => item.name);

      const res = await fetch("http://localhost:5000/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: 1,
          message,
          ingredients: ingredientsList
        })
      });

      const data = await res.json();
      console.log("🎯 AI Response:", data);

      return {
        response: "Here is your recipe suggestion:",
        recipes: data.recipes || []
      };

    } catch (err) {
      console.error("❌ Error sending message to AI:", err);
      return {
        response: "Sorry, something went wrong.",
        recipes: []
      };
    }
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading assistant...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <KitchenAssistant
        onSendMessage={onSendMessage}
        inventory={inventory}
        userPrefs={userPrefs}
        userName={userName}
      />
    </div>
  );
}
