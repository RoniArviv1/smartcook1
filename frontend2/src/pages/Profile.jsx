// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import PreferencesForm from "../components/profile/PreferencesForm";

export default function Profile() {
  /* --------------------------------------------------------------- */
  /*                חילוץ user_id  (JWT / localStorage)              */
  /* --------------------------------------------------------------- */
  const storedUser =
    JSON.parse(localStorage.getItem("smartcookUser") || "{}") || {};
  const userId =  storedUser.user_id || storedUser.id || 1;;   // fallback ל-1 בזמן פיתוח

  /* --------------------------------------------------------------- */
  /*                             STATE                               */
  /* --------------------------------------------------------------- */
  const [preferences, setPreferences] = useState(null); // {dietary:[], allergies:[], ...}
  const [loading, setLoading] = useState(true);

  /* --------------------------------------------------------------- */
  /*                        טעינת העדפות                            */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/profile/${userId}`
      );
      if (!res.ok)
        throw new Error(`GET profile failed: ${res.status}`);

      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error("❌ Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------- */
  /*                        שמירת העדפות                             */
  /* --------------------------------------------------------------- */
  const handleSubmit = async (formData) => {
    try {
      // ה-Backend שלנו תומך ב-PUT ⇢ /api/profile/<user_id>
      const url = `http://localhost:5000/api/profile/${userId}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok)
        throw new Error(`PUT profile failed: ${res.status}`);

      loadPreferences();                // רענון-state אחרי שמירה
    } catch (error) {
      console.error("❌ Error saving preferences:", error);
    }
  };

  /* --------------------------------------------------------------- */
  /*                              Render                             */
  /* --------------------------------------------------------------- */
  return (
    <div style={{ padding: 20 }}>
      <h1>👤 Profile Settings</h1>

      <PreferencesForm
        preferences={preferences}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}