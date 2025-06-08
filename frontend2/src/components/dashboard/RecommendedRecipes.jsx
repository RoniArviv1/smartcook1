import React from "react";
import RecipeCard from "../recipes/RecipeCard";

export default function RecommendedRecipes({ recipes, loading }) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Recommended for You
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: "#eee", height: "250px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : recipes?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.slice(0, 4).map((recipe, index) => (
            <RecipeCard key={index} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p>No matching recipes found.</p>
      )}
    </div>
  );
}
