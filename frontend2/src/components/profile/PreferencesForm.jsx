import React, { useState, useEffect } from 'react';
import { ChefHat } from 'lucide-react';

export default function Profile() {
  const [preferences, setPreferences] = useState({
    dietary: [],
    allergies: [],
    additionalAllergies: '',
    skillLevel: '',
    mealPrep: ''
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/profile/1');
        if (!res.ok) throw new Error('Failed to fetch preferences');
        const data = await res.json();
        setPreferences(data);
      } catch (error) {
        console.error('Error fetching preferences:', error);
        alert('Failed to load preferences.');
      }
    };
    fetchPreferences();
  }, []);

  const handleSavePreferences = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/profile/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      if (!response.ok) throw new Error('Failed to save preferences');
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences.');
    }
  };

  const toggleSelection = (type, value) => {
    setPreferences(prev => {
      const updated = prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value];
      return { ...prev, [type]: updated };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800 mb-6">
          <ChefHat /> Profile Settings
        </h1>

        <div className="bg-white rounded-xl shadow p-8">
          <h2 className="text-2xl font-semibold mb-6">Cooking & Dietary Preferences</h2>

          {/* Dietary Restrictions */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Dietary Restrictions</h3>
            <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
              {['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Nut Free', 'Kosher', 'Halal', 'Keto', 'Paleo'].map(item => (
                <label key={item}>
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={preferences.dietary.includes(item)}
                    onChange={() => toggleSelection('dietary', item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Allergies</h3>
            <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
              {['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame'].map(item => (
                <label key={item}>
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={preferences.allergies.includes(item)}
                    onChange={() => toggleSelection('allergies', item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          {/* Additional Allergies */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Allergies (comma-separated)
            </label>
            <input
              type="text"
              value={preferences.additionalAllergies}
              onChange={e => setPreferences({ ...preferences, additionalAllergies: e.target.value })}
              placeholder="e.g., avocado, nightshades..."
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-pink-200 outline-none"
            />
          </div>

          {/* Cooking Skill & Meal Prep */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Skill Level</label>
              <select
                value={preferences.skillLevel}
                onChange={e => setPreferences({ ...preferences, skillLevel: e.target.value })}
                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
              >
                <option value="">Select your cooking skill level</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Prep Preference</label>
              <select
                value={preferences.mealPrep}
                onChange={e => setPreferences({ ...preferences, mealPrep: e.target.value })}
                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none"
              >
                <option value="">Your meal prep style</option>
                <option>Quick & Easy</option>
                <option>Gourmet</option>
                <option>Healthy Focused</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSavePreferences}
            className="bg-pink-300 hover:bg-pink-400 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}