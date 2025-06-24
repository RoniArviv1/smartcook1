import React, { useEffect, useState } from "react";
import ProfileForm from "../components/profile/ProfileForm";

export default function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
  const userId = storedUser.user_id || storedUser.id || 1;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`);
      if (!res.ok) throw new Error(`GET profile failed: ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("❌ Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`PUT profile failed: ${res.status}`);

      alert("Profile updated successfully!");

      // ✅ שמירה ב־localStorage לעדכון מיידי בניווט העליון
      const existingUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
      const updatedUser = {
        ...existingUser,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        image_url: formData.image_url || formData.image,  // חשוב: לוודא שהשדה זהה למפתח בשאר הקוד
      };
      localStorage.setItem("smartcookUser", JSON.stringify(updatedUser));

      loadProfile();
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">👤 My Profile</h1>
        <ProfileForm profile={profile} loading={loading} onSave={handleSave} />
      </div>
    </div>
  );
}
