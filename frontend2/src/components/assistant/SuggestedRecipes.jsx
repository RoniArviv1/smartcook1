/*  src/components/assistant/SuggestedRecipes.jsx  */
import React, { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, ChefHat, Clock } from "lucide-react";

/* helper – מפצל טקסט בודד לצעדים */
const splitSteps = (text) =>
  String(text)
    .replace(/\*\*/g, "")          // מסיר **bold**
    .replace(/\\n/g, "\n")
    .split(/(?:\n+|\r+|^\d+\.\s+|\s*\d+\)\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);

/* Tailwind badge utility (שמור ב-JSX-style בסוף הקובץ) */
export default function SuggestedRecipes({ recipes = [] }) {
  const [open, setOpen] = useState(null);
  const toggle = useCallback((i) => setOpen((p) => (p === i ? null : i)), []);

  if (!recipes.length) return null;

  return (
    <section className="ml-11 mt-2 border rounded-lg p-5 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Suggested Recipes</h3>

      {recipes.map((r, i) => {
        const steps =
          Array.isArray(r.instructions) && r.instructions.length > 1
            ? r.instructions
            : splitSteps(r.instructions[0] || "");

        return (
          <article
            key={r.title || i}
            className="border-b last:border-0 pb-4 mb-4"
          >
            {/* header */}
            <header
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggle(i)}
            >
              <h4 className="text-orange-600 font-semibold">{r.title}</h4>
              {open === i ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </header>

            {/* badges */}
            <div className="flex flex-wrap gap-2 text-sm mt-2">
              <span className="badge">
                <ChefHat size={14} /> {r.difficulty}
              </span>
              <span className="badge">
                <Clock size={14} /> Prep {r.prep_minutes} m
              </span>
              <span className="badge">
                <Clock size={14} /> Cook {r.cook_minutes} m
              </span>
              {r.servings && (
                <span className="badge">Serves {r.servings}</span>
              )}
              {r.calories_per_serving && (
                <span className="badge">
                  {r.calories_per_serving} kcal/serv.
                </span>
              )}
            </div>

            {/* body */}
            {open === i && (
              <div className="mt-4 space-y-4 text-sm">
                {r.description && <p>{r.description}</p>}

                {/* ingredients */}
                <div>
                  <h5 className="font-semibold">Ingredients</h5>
                  <ul className="list-disc ml-6">
                    {r.ingredients.map((ing, idx) => (
                      <li key={idx}>
                        {ing.qty ? `${ing.qty} ${ing.unit || ""} ` : ""}
                        {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* instructions */}
                <div>
                  <h5 className="font-semibold">Instructions</h5>
                  <ol className="list-decimal ml-6 space-y-1">
                    {steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </article>
        );
      })}

      {/* Tailwind badge styling */}
      <style jsx="true">{`
        .badge {
          @apply border rounded px-2 py-0.5 flex items-center gap-1 bg-gray-100;
        }
      `}</style>
    </section>
  );
}
