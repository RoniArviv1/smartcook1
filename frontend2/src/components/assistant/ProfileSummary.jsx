import React from 'react';
import { 
  Apple, 
  AlertTriangle,
  Utensils, 
  UserCircle2,
  Heart
} from "lucide-react";
import { differenceInDays } from "date-fns";

export default function ProfileSummary({ userPrefs, inventory, userName }) {
  const getExpiringIngredients = () => {
    return inventory
      .filter(ing => ing.expiry_date)
      .filter(ing => {
        const daysUntilExpiry = Math.ceil((new Date(ing.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3;
      });
  };

  const getAllergies = () => {
    const allAllergies = [...(userPrefs?.allergies || [])];
    if (userPrefs?.custom_allergies) {
      const customAllergiesList = userPrefs.custom_allergies
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      allAllergies.push(...customAllergiesList);
    }
    return allAllergies;
  };

  return (
    <div style={{ margin: "1rem", backgroundColor: "#f9fafb", border: "1px dashed #ddd", borderRadius: "8px", padding: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <h3 style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <UserCircle2 style={{ width: 16, height: 16 }} />
            Profile
          </h3>
          <div style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
            <div><strong style={{ color: "#6b7280" }}>Name:</strong> {userName || "User"}</div>
            <div><strong style={{ color: "#6b7280" }}>Cooking Level:</strong> {userPrefs?.cooking_skill ? userPrefs.cooking_skill.charAt(0).toUpperCase() + userPrefs.cooking_skill.slice(1) : "Not specified"}</div>
            <div><strong style={{ color: "#6b7280" }}>Household Size:</strong> {userPrefs?.household_size || 1} {userPrefs?.household_size === 1 ? "person" : "people"}</div>
            {userPrefs?.preferred_cuisines?.length > 0 && (
              <div><strong style={{ color: "#6b7280" }}>Preferred Cuisines:</strong> {userPrefs.preferred_cuisines.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}</div>
            )}
          </div>
        </div>

        <div>
          <h3 style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Heart style={{ width: 16, height: 16 }} />
            Dietary Preferences
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {userPrefs?.dietary_restrictions?.length > 0 ? (
              userPrefs.dietary_restrictions.map(restriction => (
                <span key={restriction} style={{ backgroundColor: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: "4px", padding: "2px 6px", fontSize: "0.8rem" }}>
                  {restriction.replace('_', ' ')}
                </span>
              ))
            ) : (
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>No dietary restrictions specified</span>
            )}
          </div>

          <h4 style={{ marginTop: "1rem", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: "500" }}>Allergies:</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {getAllergies().length > 0 ? (
              getAllergies().map(allergy => (
                <span key={allergy} style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "4px", padding: "2px 6px", fontSize: "0.8rem" }}>
                  {allergy}
                </span>
              ))
            ) : (
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>No allergies specified</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <AlertTriangle style={{ width: 16, height: 16 }} />
          Expiring Soon
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {getExpiringIngredients().length > 0 ? (
            getExpiringIngredients().map(ing => (
              <span key={ing.id} style={{ backgroundColor: "#fefce8", border: "1px solid #fcd34d", color: "#92400e", borderRadius: "4px", padding: "2px 6px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <Apple style={{ width: 12, height: 12 }} /> {ing.name}
                <span style={{ fontSize: "0.75rem" }}>({differenceInDays(new Date(ing.expiry_date), new Date())} days)</span>
              </span>
            ))
          ) : (
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>No ingredients expiring soon</span>
          )}
        </div>
      </div>
    </div>
  );
}
