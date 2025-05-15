//  src/pages/Assistant.jsx
import React, { useEffect, useState, useRef } from "react";
import KitchenAssistant from "../components/assistant/KitchenAssistant";

/* ----------------------------------------------------------- */
/*         חילוץ user_id (JWT / localStorage)                  */
/* ----------------------------------------------------------- */
const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}") || {};
const userId = storedUser.id || 1;
const userName = storedUser.name || "SmartCook User";

export default function Assistant() {
  /* ------------------- state ------------------- */
  const [inventory,   setInventory] = useState([]);
  const [userPrefs,   setUserPrefs] = useState({});
  const [loading,     setLoading]   = useState(true);
  const [lastRecipe,  setLastRecipe] = useState(null);   // 🆕

  const messagesEndRef = useRef(null);

  /* ------------------- load data ---------------- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        /*  GET  /api/inventory/<user_id>  */
        const invRes  = await fetch(`http://localhost:5000/api/inventory/${userId}`);
        const invData = await invRes.json(); // {inventory:[...]}

        /*  GET  /api/profile/<user_id>   */
        const prefRes  = await fetch(`http://localhost:5000/api/profile/${userId}`);
        const prefData = await prefRes.json();

        setInventory(invData.inventory || []);
        setUserPrefs(prefData);
      } catch (err) {
        console.error("❌ Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* ------------------- send message -------------- */
  const onSendMessage = async (message) => {
    const payload = {
      user_id:    userId,
      message,
      ingredients: inventory.map((i) => i.name),
      user_prefs:  userPrefs,
      prev_recipe: lastRecipe,               // 🆕 שולחים את המתכון האחרון
    };

    try {
      const res = await fetch("http://localhost:5000/api/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Assistant failed: ${res.status}`);
      const data = await res.json(); // {recipes:[{…}], user_id:…}

      /* שומרים מתכון אחרון (אם קיים) */
      if (data.recipes?.length) setLastRecipe(data.recipes[0]);

      return {
        response: "Here is your recipe suggestion:",
        recipes:  data.recipes || [],
      };
    } catch (err) {
      console.error("❌ Error sending to AI:", err);
      return { response: "Sorry, something went wrong.", recipes: [] };
    }
  };

  /* ------------------- render -------------------- */
  if (loading) return <p style={{ padding: 20 }}>Loading assistant…</p>;

  return (
    <div style={{ padding: 20 }}>
      <KitchenAssistant
        onSendMessage={onSendMessage}
        inventory={inventory}
        userPrefs={userPrefs}
        userName={userName}
        userId={userId}
      />
      <div ref={messagesEndRef} />
    </div>
  );
}
