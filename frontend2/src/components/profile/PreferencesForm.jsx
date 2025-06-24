// src/components/profile/PreferencesForm.jsx
import React, { useState, useEffect } from "react";

export default function PreferencesForm({ preferences, loading, onSubmit }) {
  const [formData, setFormData] = useState({
    dietary: [],
    allergies: [],
    additionalAllergies: "",
    skillLevel: "",
    mealPrep: "",
  });

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const toggleSelection = (type, value) => {
    setFormData((prev) => {
      const updated = prev[type].includes(value)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value];
      return { ...prev, [type]: updated };
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (loading || !formData) return <p>Loading preferences...</p>;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8">
      <h2 className="text-2xl font-semibold mb-6">Cooking & Dietary Preferences</h2>

      {/* Dietary Restrictions */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Dietary Restrictions</h3>
        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
          {["Vegetarian", "Vegan", "Gluten Free", "Kosher", "Halal", "Keto", "Paleo"].map(
            (item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.dietary.includes(item)}
                  onChange={() => toggleSelection("dietary", item)}
                />
                {item}
              </label>
            )
          )}
        </div>
      </div>

      {/* Allergies */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Allergies</h3>
        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
          {["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Wheat", "Soy", "Fish", "Sesame"].map(
            (item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.allergies.includes(item)}
                  onChange={() => toggleSelection("allergies", item)}
                />
                {item}
              </label>
            )
          )}
        </div>
      </div>

      {/* Additional Allergies */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Allergies (comma-separated)
        </label>
        <input
          type="text"
          name="additionalAllergies"
          value={formData.additionalAllergies}
          onChange={handleChange}
          placeholder="e.g., avocado, nightshades..."
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-pink-200 outline-none"
        />
      </div>

      {/* Cooking Skill & Meal Prep */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cooking Skill Level
          </label>
          <select
            name="skillLevel"
            value={formData.skillLevel}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
          >
            <option value="">Select your cooking skill level</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meal Prep Preference
          </label>
          <select
            name="mealPrep"
            value={formData.mealPrep}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
          >
            <option value="">Your meal prep style</option>
            <option>Quick & Easy</option>
            <option>Gourmet</option>
            <option>Healthy Focused</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="bg-pink-300 hover:bg-pink-400 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
      >
        Save Changes
      </button>
    </form>
  );
}
