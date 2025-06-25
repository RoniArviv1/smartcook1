// src/components/profile/ProfileForm.jsx
import React, { useState, useEffect } from "react";

export default function ProfileForm({ profile, loading, onSave }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    image: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        password: profile.password || "",
        image: profile.image || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-4">
      <div>
        <label className="block font-medium">First Name</label>
        <input
          name="firstName"
          value={formData.firstName || ""}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Last Name</label>
        <input
          name="lastName"
          value={formData.lastName || ""}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password || ""}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Profile Picture</label>
        {formData.image && (
          <img src={formData.image} alt="Profile" className="w-24 h-24 rounded-full mb-2" />
        )}
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded"
        >
          Save Profile
        </button>

        {showSuccess && (
          <span className="text-green-700 font-semibold bg-green-100 px-3 py-1 rounded text-sm">
            ✅ Profile updated successfully!
          </span>
        )}
      </div>
    </form>
  );
}
