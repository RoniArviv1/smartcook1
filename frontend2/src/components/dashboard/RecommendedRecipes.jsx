import React from "react";
import RecipeCard from "../recipes/RecipeCard"; // ודאי שהנתיב נכון

export default function RecommendedRecipes({ recipes, userPrefs, inventory, loading }) {
  const getRecommendedRecipes = () => {
    if (!userPrefs) return recipes;

    return recipes.filter((recipe) => {
      const meetsRestrictions = !userPrefs.dietary_restrictions?.some(
        (restriction) => !recipe.dietary_tags?.includes(restriction)
      );

      const hasIngredients = recipe.ingredients?.every((needed) =>
        inventory.some(
          (inv) =>
            inv.name.toLowerCase() === needed.name.toLowerCase() &&
            inv.quantity >= needed.quantity
        )
      );

      return meetsRestrictions && hasIngredients;
    });
  };

  const recommended = getRecommendedRecipes().slice(0, 4);

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
      ) : recommended.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommended.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p>No matching recipes found.</p>
      )}
    </div>
  );
}