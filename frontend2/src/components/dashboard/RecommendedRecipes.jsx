import React from "react";
import RecipeCard from "../recipes/RecipeCard";

export default function RecommendedRecipes({ recipes, loading }) {
  const safeRecipes = Array.isArray(recipes) ? recipes : [];

  return (
    <div style={{ marginBottom: "30px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Recommended for You
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "#f3f3f3",
                height: "260px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      ) : safeRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeRecipes.slice(0, 4).map((recipe, index) => (
            <RecipeCard key={index} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          No matching recipes found.
        </p>
      )}
    </div>
  );
}
