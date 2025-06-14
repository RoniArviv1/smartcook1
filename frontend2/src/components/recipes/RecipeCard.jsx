import React, { useEffect, useState } from "react";
import {
  Timer,
  Users,
  ChefHat,
  Star,
  Image as ImageIcon,
  Save,
  Check,
} from "lucide-react";
import { fetchImage } from "../../utils/fetchImage";

export default function RecipeCard({ recipe, showRating = true, userId }) {
  const [fallbackImage, setFallbackImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false); // 🆕 אם נשמר כבר

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
    ingredients = [],
    instructions = [],
  } = recipe || {};

  const totalMinutes = prep_minutes + cook_minutes;

  useEffect(() => {
    if (!image_url && title) {
      fetchImage(title).then((url) => {
        if (url) setFallbackImage(url);
      });
    }
  }, [image_url, title]);

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/recipes/saved/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error("❌ Failed to save recipe:", err);
    }
  };

  if (!recipe) return null;

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white max-w-sm text-sm">
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        {image_url || fallbackImage ? (
          <img
            src={image_url || fallbackImage}
            alt={title}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        {showRating && average_rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" />
            {average_rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-base mb-1 leading-tight line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {totalMinutes} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {servings}
          </div>
          <div className="flex items-center gap-1 capitalize">
            <ChefHat className="w-3 h-3" />
            {difficulty}
          </div>
        </div>

        {expanded && (
          <>
            {ingredients.length > 0 && (
              <div className="mb-2">
                <h4 className="font-semibold text-xs mb-1">Ingredients:</h4>
                <ul className="list-disc list-inside text-xs text-gray-700">
                  {ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.qty} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {instructions.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs mb-1">Instructions:</h4>
                <ol className="list-decimal list-inside text-xs text-gray-700">
                  {instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        <button
          className="text-orange-600 text-xs mt-1 hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "See less" : "See more"}
        </button>

        <div className="flex justify-between items-center mt-2">
          <div className="flex flex-wrap gap-2">
            {dietary_tags.length ? (
              dietary_tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-[10px] capitalize"
                >
                  {tag.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-xs">
                No dietary tags specified
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            className="text-xs text-orange-600 flex items-center gap-1 hover:underline disabled:text-gray-400"
          >
            {saved ? (
              <>
                <Check className="w-3 h-3" /> Saved
              </>
            ) : (
              <>
                <Save className="w-3 h-3" /> Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
