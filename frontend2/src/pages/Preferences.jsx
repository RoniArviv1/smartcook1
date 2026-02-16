// src/pages/Preferences.jsx
import { API_BASE } from "../utils/api";
import React, { useEffect, useState } from "react";
import PreferencesForm from "../components/profile/PreferencesForm";

export default function Preferences() {
const token = localStorage.getItem("token"); // מושך את המפתח ששמרנו ב-Login

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const currentToken = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/preferences`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
      if (!res.ok) throw new Error(`GET preferences failed: ${res.status}`);
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error("❌ Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    const currentToken = localStorage.getItem("token");
    try {
      const url = `${API_BASE}/api/preferences`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" ,
          "Authorization": `Bearer ${currentToken}` // מוסיפים את המפתח כאן
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`PUT preferences failed: ${res.status}`);
      loadPreferences(); // reload after save
    } catch (error) {
      console.error("❌ Error saving preferences:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800 mb-6">
          👤 Preferences Settings
        </h1>
        <PreferencesForm
          preferences={preferences}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
