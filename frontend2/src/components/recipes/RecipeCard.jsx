// src/components/recipes/RecipeCard.jsx
import React from "react";
import {
  Timer,
  Users,
  ChefHat,
  Star,
  Image as ImageIcon,
} from "lucide-react";

export default function RecipeCard({ recipe, showRating = true }) {
  if (!recipe) return null;

  /* ---------- דסטרקטור + ערכי ברירת-מחדל ---------- */
  const {
    title = "AI Suggested Recipe",
    description = "",
    image_url,
    average_rating = 0,
    servings = 2,
    difficulty = "Medium",
    prep_minutes = 15,
    cook_minutes = 25,
    dietary_tags = [],
  } = recipe;

  const totalMinutes = prep_minutes + cook_minutes;

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* ---------- תמונה ---------- */}
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        {showRating && average_rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
            {average_rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* ---------- תוכן הכרטיס ---------- */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>

        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {totalMinutes} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {servings} servings
          </div>
          <div className="flex items-center gap-1 capitalize">
            <ChefHat className="w-4 h-4" />
            {difficulty}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {dietary_tags.length ? (
            dietary_tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs capitalize"
              >
                {tag.replace("_", " ")}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">
              No dietary tags specified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}