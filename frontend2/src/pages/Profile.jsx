import React, { useEffect, useState } from "react";
import PreferencesForm from "../components/profile/PreferencesForm";

export default function Profile() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/profile");
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    try {
      const method = preferences ? "PUT" : "POST";
      const url = preferences
        ? `http://localhost:5000/api/profile/${preferences.id}`
        : `http://localhost:5000/api/profile`;

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      loadPreferences();
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>👤 Profile Settings</h1>
      <PreferencesForm
        preferences={preferences}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

