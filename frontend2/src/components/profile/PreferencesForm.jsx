import React, { useEffect, useState } from "react";

const CUISINES = [
  "italian", "mexican", "indian", "chinese", "japanese",
  "mediterranean", "american", "french", "thai"
];

const DIETARY_RESTRICTIONS = [
  "vegetarian", "vegan", "gluten_free", "dairy_free", "nut_free",
  "kosher", "halal", "keto", "paleo", "low_carb", "low_sugar"
];

const COMMON_ALLERGIES = [
  "peanuts", "tree_nuts", "dairy", "eggs", "wheat",
  "soy", "fish", "shellfish", "sesame"
];

const COOKING_SKILLS = ["beginner", "intermediate", "advanced"];

export default function PreferencesForm({ preferences, loading, onSubmit }) {
  const [form, setForm] = useState({
    dietary_restrictions: [],
    cooking_skill: "",
    preferred_cuisines: [],
    allergies: [],
    household_size: 1,
    health_goals: "",
    cooking_frequency: "",
    meal_prep_preference: "",
    custom_notes: "",
    custom_allergies: ""
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (preferences) setForm(preferences);
  }, [preferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleCheckbox = (field, value) => {
    setForm((prev) => {
      const current = [...(prev[field] || [])];
      const index = current.indexOf(value);
      if (index === -1) current.push(value);
      else current.splice(index, 1);
      return { ...prev, [field]: current };
    });
  };

  if (loading) return <p>Loading preferences...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Cooking & Dietary Preferences</h2>
      {showSuccess && <p style={{ color: "green" }}>Preferences saved successfully!</p>}

      <h3>Dietary Restrictions</h3>
      {DIETARY_RESTRICTIONS.map((item) => (
        <label key={item} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={form.dietary_restrictions.includes(item)}
            onChange={() => toggleCheckbox("dietary_restrictions", item)}
          /> {item.replace(/_/g, " ")}
        </label>
      ))}

      <h3>Allergies</h3>
      {COMMON_ALLERGIES.map((item) => (
        <label key={item} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={form.allergies.includes(item)}
            onChange={() => toggleCheckbox("allergies", item)}
          /> {item.replace(/_/g, " ")}
        </label>
      ))}
      <label style={{ display: "block", marginTop: "10px" }}>
        Additional Allergies:
        <input
          type="text"
          value={form.custom_allergies}
          onChange={(e) => setForm({ ...form, custom_allergies: e.target.value })}
          placeholder="e.g., avocado, kiwi"
          style={{ width: "100%" }}
        />
      </label>

      <label>
        Cooking Skill:
        <select
          value={form.cooking_skill}
          onChange={(e) => setForm({ ...form, cooking_skill: e.target.value })}
        >
          <option value="">Select...</option>
          {COOKING_SKILLS.map((skill) => (
            <option key={skill} value={skill}>{skill}</option>
          ))}
        </select>
      </label>

      <label>
        Household Size:
        <input
          type="number"
          value={form.household_size}
          onChange={(e) => setForm({ ...form, household_size: parseInt(e.target.value) })}
          min="1"
        />
      </label>

      <label>
        Cooking Frequency:
        <select
          value={form.cooking_frequency}
          onChange={(e) => setForm({ ...form, cooking_frequency: e.target.value })}
        >
          <option value="">Select...</option>
          <option value="daily">Daily</option>
          <option value="few_times_a_week">Few times a week</option>
          <option value="weekends">Weekends only</option>
          <option value="rarely">Rarely</option>
        </select>
      </label>

      <label>
        Meal Prep Preference:
        <select
          value={form.meal_prep_preference}
          onChange={(e) => setForm({ ...form, meal_prep_preference: e.target.value })}
        >
          <option value="">Select...</option>
          <option value="batch_cooking">Batch cooking</option>
          <option value="daily_fresh">Fresh daily meals</option>
          <option value="quick_meals">Quick & easy meals</option>
          <option value="gourmet">Gourmet cooking</option>
        </select>
      </label>

      <label>
        Health Goals:
        <select
          value={form.health_goals}
          onChange={(e) => setForm({ ...form, health_goals: e.target.value })}
        >
          <option value="">Select...</option>
          <option value="weight_loss">Weight Loss</option>
          <option value="muscle_gain">Muscle Gain</option>
          <option value="balanced_diet">Balanced Diet</option>
          <option value="high_protein">High Protein</option>
          <option value="low_sodium">Low Sodium</option>
          <option value="high_fiber">High Fiber</option>
        </select>
      </label>

      <label>
        Preferred Cuisine:
        <select
          value={form.preferred_cuisines[0] || ""}
          onChange={(e) => setForm({ ...form, preferred_cuisines: [e.target.value] })}
        >
          <option value="">Select...</option>
          {CUISINES.map((cuisine) => (
            <option key={cuisine} value={cuisine}>{cuisine}</option>
          ))}
        </select>
      </label>

      <label>
        Notes:
        <textarea
          value={form.custom_notes}
          onChange={(e) => setForm({ ...form, custom_notes: e.target.value })}
          placeholder="Tell us more about your preferences"
          style={{ width: "100%", minHeight: "80px" }}
        />
      </label>

      <button type="submit" style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#f97316", color: "white", border: "none", borderRadius: "6px" }}>
        Save Preferences
      </button>
    </form>
  );
}
