/*  src/components/assistant/SuggestedRecipes.jsx  */
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  ChefHat,
} from "lucide-react";

/**
 * SuggestedRecipes
 * ----------------
 * מציג רשימת מתכונים שה-AI החזיר, עם לחצן Show / Hide.
 * מטפל בכל פורמט של ingredients / instructions.
 */
export default function SuggestedRecipes({ recipes }) {
  const [expanded, setExpanded] = useState(false);

  if (!recipes || recipes.length === 0) return null;

  /* helper – הופך ingredients (string | object | array) למערך אחיד */
  const normalizeIngredients = (ing) =>
    Array.isArray(ing) ? ing : ing ? [ing] : [];

  /* helper – strips code-blocks out of instructions */
  const cleanText = (txt) =>
    String(txt).replace(/```[^]*?```/g, "").trim();

  return (
    <div
      style={{
        marginLeft: "2.75rem",
        marginTop: "0.5rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
      }}
    >
      <h3
        style={{
          marginBottom: "1rem",
          fontWeight: "bold",
          fontSize: "1.1rem",
        }}
      >
        Suggested Recipes
      </h3>

      {recipes.map((recipe, index) => {
        /* defaults */
        const difficulty   = recipe.difficulty   || "Medium";
        const prep         = recipe.prep_minutes || 15;
        const cook         = recipe.cook_minutes || 25;
        const ingredients  = normalizeIngredients(recipe.ingredients);
        const instructions = Array.isArray(recipe.instructions)
          ? recipe.instructions
          : recipe.instructions
          ? [recipe.instructions]
          : [];

        return (
          <div
            key={index}
            style={{
              marginBottom: "1.5rem",
              borderBottom: "1px solid #eee",
              paddingBottom: "1rem",
            }}
          >
            <h4
              style={{
                color: "#ea580c",
                fontSize: "1rem",
                fontWeight: "600",
              }}
            >
              {recipe.title}
            </h4>

            {/* badges */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <span className="badge">
                <ChefHat className="icon" />
                {difficulty}
              </span>
              <span className="badge">
                <Clock className="icon" />
                Prep: {prep} min
              </span>
              <span className="badge">
                <Clock className="icon" />
                Cook: {cook} min
              </span>
            </div>

            {/* details – only if expanded */}
            {expanded && (
              <>
                {/* Ingredients */}
                <div style={{ marginTop: "1rem" }}>
                  <p className="section-title">Ingredients:</p>
                  {ingredients.length ? (
                    <ul className="list">
                      {ingredients.map((ing, i) => {
                        if (typeof ing === "string") return <li key={i}>{ing}</li>;

                        if (typeof ing === "object" && ing !== null) {
                          const { name = "", qty = "" } = ing;
                          return (
                            <li key={i}>
                              {qty ? `${qty} ` : ""}
                              {name}
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  ) : (
                    <p className="placeholder">No ingredients provided.</p>
                  )}
                </div>

                {/* Instructions */}
                <div style={{ marginTop: "1rem" }}>
                  <p className="section-title">Instructions:</p>
                  {instructions.length ? (
                    <ol className="list-decimal">
                      {instructions.map((step, i) => (
                        <li key={i} style={{ marginBottom: "0.5rem" }}>
                          {cleanText(step)}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="placeholder">No instructions provided.</p>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          border: "none",
          background: "none",
          color: "#4b5563",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        {expanded ? (
          <>
            <ChevronUp className="icon" /> Show Less
          </>
        ) : (
          <>
            <ChevronDown className="icon" /> Show Recipe Details
          </>
        )}
      </button>

      {/* inline styles for badges & icons */}
      <style jsx="true">{`
        .badge {
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
        }
        .icon {
          width: 14px;
          height: 14px;
        }
        .section-title {
          font-weight: bold;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        .list {
          margin-left: 1.5rem;
          color: #4b5563;
          font-size: 0.875rem;
        }
        .list-decimal {
          margin-left: 1.5rem;
          color: #4b5563;
          font-size: 0.875rem;
        }
        .placeholder {
          color: #4b5563;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
