import React from 'react';
import { ChevronDown, ChevronUp, Clock, ChefHat } from "lucide-react";

export default function SuggestedRecipes({ recipes }) {
  const [expanded, setExpanded] = React.useState(false);

  if (!recipes || recipes.length === 0) return null;

  return (
    <div style={{ marginLeft: "2.75rem", marginTop: "0.5rem", border: "1px solid #ddd", borderRadius: "8px", padding: "1rem" }}>
      <h3 style={{ marginBottom: "1rem", fontWeight: "bold", fontSize: "1.1rem" }}>Suggested Recipes</h3>

      {recipes.map((recipe, index) => (
        <div key={index} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
          <h4 style={{ color: "#ea580c", fontSize: "1rem", fontWeight: "600" }}>{recipe.title}</h4>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <ChefHat style={{ width: "14px", height: "14px" }} />
              Medium
            </span>
            <span style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock style={{ width: "14px", height: "14px" }} />
              Prep: 15 min
            </span>
            <span style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock style={{ width: "14px", height: "14px" }} />
              Cook: 25 min
            </span>
          </div>

          {expanded && (
            <>
              {/* הצגת רכיבים */}
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Ingredients:</p>
                {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                  <ul style={{ marginLeft: "1.5rem", color: "#4b5563", fontSize: "0.875rem" }}>
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>No ingredients provided.</p>
                )}
              </div>

              {/* הצגת הוראות הכנה */}
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Instructions:</p>
                {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
                  <ol style={{ marginLeft: "1.5rem", color: "#4b5563", fontSize: "0.875rem" }}>
                    {recipe.instructions.map((step, i) => (
                      <li key={i} style={{ marginBottom: "0.5rem" }}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>No instructions provided.</p>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      <button
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", border: "none", background: "none", color: "#4b5563", fontSize: "0.9rem", cursor: "pointer" }}
      >
        {expanded ? (
          <>
            <ChevronUp style={{ width: "16px", height: "16px", marginRight: "4px" }} /> Show Less
          </>
        ) : (
          <>
            <ChevronDown style={{ width: "16px", height: "16px", marginRight: "4px" }} /> Show Recipe Details
          </>
        )}
      </button>
    </div>
  );
}
