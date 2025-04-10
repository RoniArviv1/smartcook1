import React from 'react';
import { Timer, Users, ChefHat, Star } from "lucide-react";

export default function RecipeCard({ recipe, showRating = true }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
        />
        {showRating && recipe.average_rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
            {recipe.average_rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{recipe.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {recipe.prep_time + recipe.cook_time} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {recipe.servings} servings
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            {recipe.difficulty}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {recipe.dietary_tags?.map((tag) => (
            <span
              key={tag}
              className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs capitalize"
            >
              {tag.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
