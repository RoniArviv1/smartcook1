import React, { useState } from "react";
import SuggestedRecipes from "../components/assistant/SuggestedRecipes";
import axios from "axios";

export default function Assistant() {
  const [recipes, setRecipes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [freeText, setFreeText] = useState(""); // משתנה לאחסון טקסט חופשי שהמשתמש יכתוב

  const token = localStorage.getItem("token"); // או מאיפה שאת שומרת את ה-token

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/assistant", // כתובת ה-API שלך
        {
          user_id: 1, // לדוגמה, אפשר לשנות לפי הצורך
          free_text: freeText, // שליחה של הטקסט החופשי בלבד
        },
        {
          headers: { Authorization: `Bearer ${token}` }, // הוספת ה-token בכותרת הבקשה
        }
      );
      setRecipes(res.data.response); // מתקבל JSON
    } catch (err) {
      setError("Something went wrong.");
    }

    setLoading(false);
  };

  const handleTextChange = (event) => {
    setFreeText(event.target.value); // עדכון הטקסט החופשי
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🧠 SmartCook Assistant</h1>

      <button onClick={handleSuggest} disabled={loading}>
        {loading ? "Thinking..." : "Suggest me recipes"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        <textarea
          placeholder="Ask me anything about recipes..."
          value={freeText}
          onChange={handleTextChange}
          rows={4}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        />
      </div>

      {recipes && <SuggestedRecipes recipes={recipes} />}
    </div>
  );
}
