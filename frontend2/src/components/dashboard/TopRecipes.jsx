import React from "react";
import RecipeCard from "../recipes/RecipeCard"; // ודאי שהנתיב מתאים

export default function TopRecipes({ recipes, loading }) {
  const getTopRecipes = () => {
    return [...recipes]
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 4);
  };

  const topRecipes = getTopRecipes();

  return (
    <div style={{ marginBottom: "30px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Top Rated Recipes
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: "#eee",
                height: "250px",
                borderRadius: "8px",
              }}
            />
          ))}
        </div>
      ) : topRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p>No top recipes available.</p>
      )}
    </div>
  );
}
