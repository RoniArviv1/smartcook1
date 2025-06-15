import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import sha256 from "crypto-js/sha256";

export default function RatingStars({ recipe, userId }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [average, setAverage] = useState(recipe.average_rating || 0);

  // חישוב recipe_hash אם לא קיים
  const recipeHash = recipe.recipe_hash || sha256(JSON.stringify(recipe)).toString();

  useEffect(() => {
    if (recipeHash) {
      fetch(`http://localhost:5000/api/recipes/rating/${recipeHash}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.average_rating) setAverage(data.average_rating);
        });
    }
  }, [recipeHash]);

  const handleRate = async (value) => {
    setSelected(value);
    try {
      const res = await fetch("http://localhost:5000/api/recipes/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, rating: value, recipe: { ...recipe, recipe_hash: recipeHash } }),
      });

      const data = await res.json();
      if (res.ok && data.recipe_hash) {
        const ratingRes = await fetch(`http://localhost:5000/api/recipes/rating/${data.recipe_hash}`);
        const ratingData = await ratingRes.json();
        if (ratingData.average_rating) setAverage(ratingData.average_rating);
      }
    } catch (err) {
      console.error("Rating failed:", err);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`w-4 h-4 cursor-pointer transition-colors duration-150 ${
            (hovered || selected || average) >= value
              ? "fill-yellow-400 stroke-yellow-400"
              : "stroke-gray-400"
          }`}
          onMouseEnter={() => setHovered(value)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleRate(value)}
        />
      ))}
      <span className="text-xs text-gray-600 ml-2">
        {typeof average === "number" ? average.toFixed(1) + " avg" : "No rating yet"}
      </span>
    </div>
  );
}
