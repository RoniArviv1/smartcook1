import { API_BASE } from "../utils/api";
import React, { useEffect, useState, useRef } from "react";
import KitchenAssistant from "../components/assistant/KitchenAssistant";

/* ----------------------------------------------------------- */
/*         חילוץ user_id (JWT / localStorage)                  */
/* ----------------------------------------------------------- */

const token = localStorage.getItem("token"); // מושך את המפתח ששמרנו ב-Login
const userName = JSON.parse(localStorage.getItem("smartcookUser") || "{}").username || "User";
const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
const userId = storedUser.user_id;


export default function Assistant() {
  /* ------------------- state ------------------- */
  const [inventory, setInventory] = useState([]);
  const [userPrefs, setUserPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRecipe, setLastRecipe] = useState(null);
  const [useExpiring, setUseExpiring] = useState(false);
  const messagesEndRef = useRef(null);

  /* ------------------- load data ---------------- */
  useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      // שימי לב: הורדנו את ה-userId מהכתובת והוספנו Authorization
      const invRes = await fetch(`${API_BASE}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const invData = await invRes.json();

      const prefRes = await fetch(`${API_BASE}/api/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
}, [token]);


  /* ------------------- send message -------------- */
  const onSendMessage = async (message) => {
    const currentToken = localStorage.getItem("token");
    const payload = {
      user_id: userId,
      message,
      user_prefs: userPrefs,
      prev_recipe: lastRecipe || null,  // ✅ שימו לב – רק אובייקט או null
      use_expiring_soon: useExpiring
    };

    try {
      const res = await fetch(`${API_BASE}/api/assistant`, {
        method: "POST",
        headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${currentToken}` // מוסיפים את המפתח כאן
    },
    body: JSON.stringify(payload),
  });

      if (!res.ok) throw new Error(`Assistant failed: ${res.status}`);
      const data = await res.json();

      if (data.recipes?.length) setLastRecipe(data.recipes[0]);

      return {
        response: "Here is your recipe suggestion:",
        recipes: data.recipes || [],
      };
    } catch (err) {
      const rawError = err?.message || String(err);
      console.error("❌ Error sending to AI:", rawError);

      return {
        response: `Sorry, something went wrong.\n\n⚠️ Error details:\n${rawError}`,
        recipes: [],
      };
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
        useExpiring={useExpiring}
        setUseExpiring={setUseExpiring}
      />
      <div ref={messagesEndRef} />
    </div>
  );
}
