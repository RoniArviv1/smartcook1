// src/pages/Assistant.jsx
import React, { useEffect, useState } from "react";
import KitchenAssistant from "../components/assistant/KitchenAssistant";

export default function Assistant() {
  /* ----------------------------------------------------------- */
  /*                חילוץ user_id  (JWT / localStorage)          */
  /* ----------------------------------------------------------- */
  const storedUser =
    JSON.parse(localStorage.getItem("smartcookUser") || "{}") || {};
  const userId   = storedUser.id   || 1;           // fallback = 1
  const userName = storedUser.name || "SmartCook User";

  /* ----------------------------------------------------------- */
  /*                           STATE                             */
  /* ----------------------------------------------------------- */
  const [inventory, setInventory] = useState([]);  // [{id,name,...}]
  const [userPrefs, setUserPrefs] = useState({});  // {dietary:[], allergies:[], ...}
  const [loading,    setLoading]  = useState(true);

  /* ----------------------------------------------------------- */
  /*          טעינת מלאי + העדפות בפריקת העמוד                 */
  /* ----------------------------------------------------------- */
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      /*   GET  /api/inventory/<user_id>   */
      const invRes = await fetch(
        `http://localhost:5000/api/inventory/${userId}`
      );
      if (!invRes.ok)
        throw new Error(`Inventory request failed: ${invRes.status}`);
      const invData = await invRes.json();         // {inventory:[...]}

      /*   GET  /api/profile/<user_id>     */
      const prefRes = await fetch(
        `http://localhost:5000/api/profile/${userId}`
      );
      if (!prefRes.ok)
        throw new Error(`Profile request failed: ${prefRes.status}`);
      const prefData = await prefRes.json();

      setInventory(invData.inventory || []);
      setUserPrefs(prefData);
    } catch (err) {
      console.error("❌ Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------- */
  /*              שליחת הודעה ל-Assistant (Groq)                 */
  /* ----------------------------------------------------------- */
  const onSendMessage = async (message /*, history */) => {
    try {
      const ingredientsList = inventory.map((i) => i.name);
      const res = await fetch("http://localhost:5000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:    userId,
          message,
          ingredients: ingredientsList,
          user_prefs:  userPrefs,       // ← העדפות!
        }),
      });

      if (!res.ok)
        throw new Error(`Assistant failed: ${res.status}`);
      const data = await res.json();     // {recipes:[{...}], user_id:...}

      return {
        response: "Here is your recipe suggestion:",
        recipes:  data.recipes || [],
      };
    } catch (err) {
      console.error("❌ Error sending to AI:", err);
      return {
        response: "Sorry, something went wrong.",
        recipes: [],
      };
    }
  };

  /* ----------------------------------------------------------- */
  /*                           Render                            */
  /* ----------------------------------------------------------- */
  if (loading) return <p style={{ padding: 20 }}>Loading assistant…</p>;

  return (
    <div style={{ padding: 20 }}>
      <KitchenAssistant
        onSendMessage={onSendMessage}
        inventory={inventory}
        userPrefs={userPrefs}
        userName={userName}
      />
    </div>
  );
}
