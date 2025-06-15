// src/components/assistant/KitchenAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  ChefHat, Sparkles, Apple, CornerUpLeft,
  CheckSquare, Square, Heart, Trash,
  ChevronDown, ChevronUp
} from "lucide-react";
import Button from "../ui/button";
import ChatMessage from "./ChatMessage";
import SuggestedRecipes from "./SuggestedRecipes";
import ProfileSummary from "./ProfileSummary";
import { Link } from "react-router-dom";

/* ────────────── קבוצות אופציות ────────────── */
const MULTI_OPTS   = ["Lower calories", "Faster to make"];
const INSTANT_OPTS = ["Show me another recipe", "Surprise me"];
const FLOW_OPTS    = [
  "Exclude an ingredient",
  "Must include an ingredient",
  "Choose a cuisine style"
];

const SINGLE_MAP = {
  "Show me another recipe":
    "Please suggest a completely different recipe based on my preferences.",
  "Surprise me":
    "Surprise me with something unexpected and creative using my preferences."
};

/* ═══════════ קומפוננטת SmartCook Assistant ═══════════ */
export default function KitchenAssistant({
  inventory,
  userName,
  userId,
  onSendMessage
}) {
  /* ────────── state הודעות ────────── */
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      content: `👋 Hello${userName ? ` ${userName}` : ""}, I'm your SmartCook Assistant.\nHow can I inspire your next meal today?`
    }
  ]);
  const [lastRecipeIndex, setLastRecipeIndex] = useState(null);
  const messagesEndRef = useRef(null);

  /* ────────── בחירה מרובה + Spice ────────── */
  const [pendingOpts, setPendingOpts] = useState([]);
  const [spiceState,  setSpiceState]  = useState("none");   // none | more | mild

  /* ────────── זרימות נוספות ────────── */
  const [awaitingExclusion, setAwaitingExclusion] = useState(false);
  const [excludedItems,     setExcludedItems]     = useState([]);
  const [awaitingInclude,   setAwaitingInclude]   = useState(false);
  const [includeItems,      setIncludeItems]      = useState([]);
  const [choosingCuisine,   setChoosingCuisine]   = useState(false);

  /* ────────── פרופיל ושמורים ────────── */
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/recipes/saved/${userId}`)
      .then(res => res.json())
      .then(setSavedRecipes)
      .catch(console.error);
  }, [userId]);
  



  const [showSaved,    setShowSaved]    = useState(false);
  const [openSavedIdx, setOpenSavedIdx] = useState(null);

  /* ────────── אפקטים ────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("smartcook_saved", JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  /* ────────── פונקציות עזר ────────── */
  const buildMods = () => {
    const parts = [];
    if (pendingOpts.length)
      parts.push(pendingOpts.map(o => o.toLowerCase()).join(" and "));
    if (spiceState === "more") parts.push("spicier");
    if (spiceState === "mild") parts.push("mild (no spice)");
    return parts.join(" and ");
  };

  const resetMods = () => {
    setPendingOpts([]);
    setSpiceState("none");
  };

  const sendUserMessage = async (msg) => {
    if (!inventory || inventory.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content:
            "🧺 It looks like your ingredient list is empty. Please add some ingredients to your inventory so I can recommend a recipe 😊",
        },
      ]);
      return;
    }
  
    setMessages(prev => [...prev, { type: "user", content: msg }]);
    const res = await onSendMessage(msg, messages.slice(-4));
    setMessages(prev => [
      ...prev,
      {
        type: "assistant",
        content: res.response || "Sorry, something went wrong.",
        suggestedRecipes: res.recipes || []
      }
    ]);
    if (res.recipes?.length) setLastRecipeIndex(messages.length + 1);
  };

  /* ────────── Profile fetch ────────── */
  const fetchProfile = async () => {
    try {
      const r = await fetch(`http://localhost:5000/api/profile/${userId}`);
      if (r.ok) setProfileData(await r.json());
    } catch (e) {
      console.error(e);
    }
  };

  /* ────────── Apply / Cancel ────────── */
  const applyPending = async () => {
    if (!pendingOpts.length && spiceState === "none") return;

    if (
      pendingOpts.length === 1 &&
      spiceState === "none" &&
      INSTANT_OPTS.includes(pendingOpts[0])
    ) {
      await sendUserMessage(SINGLE_MAP[pendingOpts[0]]);
      return resetMods();
    }

    await sendUserMessage(`Please make the last recipe ${buildMods()}.`);
    resetMods();
  };

  const cancelPending = () => resetMods();

  /* ────────── Exclude / Include / Cuisine combined submit ────────── */
  const submitExclude = async () => {
    if (!excludedItems.length) return;
  
    // 🧠 רכיבים שלא ניתן לבשל מהם מתכון לבד
    const NON_STANDALONE_INGREDIENTS = [
      "butter", "salt", "pepper", "oil", "spices", "sugar", "water"
    ];
  
    // 🧮 סינון רכיבים שמישרים אחרי ההחרגה
    const remainingIngredients = inventory
      .map(it => it.name.toLowerCase())
      .filter(name => !excludedItems.map(e => e.toLowerCase()).includes(name))
      .filter(name => !NON_STANDALONE_INGREDIENTS.includes(name));
  
    if (remainingIngredients.length === 0) {
      setMessages(prev => [
        ...prev,
        {
          type: "assistant",
          content:
            "❗ After excluding ingredients, only unusable items remain (like butter or spices). Please keep at least one usable ingredient for a proper recipe.",
        },
      ]);
      setAwaitingExclusion(false);
      setExcludedItems([]);
      return;
    }
  
    const txt = buildMods()
      ? `Please make the last recipe ${buildMods()} and exclude: ${excludedItems.join(", ")}.`
      : `Please adjust the last recipe to exclude: ${excludedItems.join(", ")}.`;
  
    await sendUserMessage(txt);
    setAwaitingExclusion(false);
    setExcludedItems([]);
    resetMods();
  };
  
  const submitInclude = async () => {
    if (!includeItems.length) return;
    const txt = buildMods()
      ? `Please make the last recipe ${buildMods()} and MUST include: ${includeItems.join(", ")}.`
      : `Please suggest a recipe that MUST include: ${includeItems.join(", ")}.`;
    await sendUserMessage(txt);
    setAwaitingInclude(false);
    setIncludeItems([]);
    resetMods();
  };

  const submitCuisine = async (style) => {
    const txt = buildMods()
      ? `Please make the last recipe ${buildMods()} in a ${style} style.`
      : `Please suggest a ${style} style recipe using my preferences.`;
    await sendUserMessage(txt);
    setChoosingCuisine(false);
    resetMods();
  };

  /* ────────── toggle helpers ────────── */
  const togglePending = (opt) =>
    setPendingOpts(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );

  const toggleItem = (name, list, setter) =>
    setter(list.includes(name) ? list.filter(i => i !== name) : [...list, name]);

  /* ────────── save / delete recipe ────────── */
  const saveRecipe = (r) => {
    fetch(`http://localhost:5000/api/recipes/saved/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
    })
      .then(() => setSavedRecipes(prev => [...prev, r]))
      .catch(console.error);
  };
    const deleteRecipe = async (title) => {
  try {
    const res = await fetch(`http://localhost:5000/api/recipes/saved/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      setSavedRecipes(savedRecipes.filter((r) => r.title !== title));
    } else {
      console.error("❌ Failed to delete from server");
    }
  } catch (err) {
    console.error("❌ Failed to delete recipe:", err);
  }
};


  /* ═══════════════ render ═══════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col items-center p-6">
      {/* HEADER */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gray-200 p-2 rounded-full">
            <ChefHat className="w-5 h-5 text-gray-700" />
          </div>
          <h1 className="text-2xl font-light text-gray-800">SmartCook Assistant</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (!showProfile) fetchProfile();
              setShowProfile(!showProfile);
            }}
          >
            <Sparkles className="w-4 h-4 mr-1" /> Profile
          </Button>
          <Button variant="ghost" onClick={() => setShowSaved(!showSaved)}>
            <Heart className="w-4 h-4 mr-1" /> Saved Recipes
          </Button>
          <Link to="/inventory">
            <Button variant="ghost">
              <Apple className="w-4 h-4 mr-1" /> Ingredients
            </Button>
          </Link>
        </div>
      </header>

      {/* CHAT */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i}>
              <ChatMessage
                message={m}
                onRetry={() => {
                  const last = [...messages]
                    .reverse()
                    .find(x => x.type === "user")?.content;
                  if (last) sendUserMessage(last);
                }}
              />
              {m.suggestedRecipes && (
                <SuggestedRecipes recipes={m.suggestedRecipes} onSave={saveRecipe} userId={userId} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Start button */}
        {messages.length === 1 && (
          <div className="p-6 flex justify-center">
            <Button
              className="bg-orange-500 text-white"
              onClick={() =>
                sendUserMessage("Get me a recipe using my preferences and ingredients.")
              }
            >
              Get me a recipe using my preferences and ingredients
            </Button>
          </div>
        )}

        {/* MAIN OPTION BAR */}
        {lastRecipeIndex !== null &&
          messages.some(m => m.suggestedRecipes?.length) &&
          !awaitingExclusion &&
          !awaitingInclude &&
          !choosingCuisine && (
            <div className="border-t p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                Select options (multiple allowed):
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {/* Spice button */}
                <Button
                  variant={spiceState === "none" ? "outline" : "selected"}
                  className="text-sm flex items-center gap-1"
                  onClick={() =>
                    setSpiceState(
                      spiceState === "none"
                        ? "more"
                        : spiceState === "more"
                        ? "mild"
                        : "none"
                    )
                  }
                >
                  {spiceState !== "none" && "✔︎"}
                  {spiceState === "none" && "Spice"}
                  {spiceState === "more" && "Spice: hotter"}
                  {spiceState === "mild" && "Spice: mild"}
                </Button>

                {/* Multi opts */}
                {MULTI_OPTS.map(opt => {
                  const sel = pendingOpts.includes(opt);
                  return (
                    <Button
                      key={opt}
                      variant={sel ? "selected" : "outline"}
                      className="text-sm flex items-center gap-1"
                      onClick={() => togglePending(opt)}
                    >
                      {sel && "✔︎"} {opt}
                    </Button>
                  );
                })}

                {/* Instant opts */}
                {INSTANT_OPTS.map(opt => {
                  const sel = pendingOpts.includes(opt);
                  return (
                    <Button
                      key={opt}
                      variant={sel ? "selected" : "outline"}
                      className="text-sm flex items-center gap-1"
                      onClick={() => togglePending(opt)}
                    >
                      {sel && "✔︎"} {opt}
                    </Button>
                  );
                })}

                {/* Flow triggers */}
                {FLOW_OPTS.map(opt => (
                  <Button
                    key={opt}
                    variant="outline"
                    className="text-sm"
                    onClick={() => {
                      if (opt === "Exclude an ingredient") setAwaitingExclusion(true);
                      else if (opt === "Must include an ingredient")
                        setAwaitingInclude(true);
                      else setChoosingCuisine(true);
                    }}
                  >
                    {opt}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  className="bg-orange-500 text-white"
                  onClick={applyPending}
                  disabled={!pendingOpts.length && spiceState === "none"}
                >
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  onClick={cancelPending}
                  disabled={!pendingOpts.length && spiceState === "none"}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

        {/* -------- Exclude Panel -------- */}
        {awaitingExclusion && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">
              Select ingredients to exclude:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {inventory.map((it, idx) => {
                const name = it.name ?? it;
                const sel = excludedItems.includes(name);
                return (
                  <Button
                    key={idx}
                    variant={sel ? "selected" : "outline"}
                    className="text-sm flex items-center gap-1"
                    onClick={() =>
                      toggleItem(name, excludedItems, setExcludedItems)
                    }
                  >
                    {sel ? <CheckSquare size={14} /> : <Square size={14} />}{" "}
                    {name}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button className="bg-orange-500 text-white" onClick={submitExclude}>
                Apply Exclusion
              </Button>
              <Button
                variant="ghost"
                className="text-sm flex items-center gap-1"
                onClick={() => {
                  setAwaitingExclusion(false);
                  setExcludedItems([]);
                }}
              >
                <CornerUpLeft size={16} /> Back
              </Button>
            </div>
          </div>
        )}

        {/* -------- Include Panel -------- */}
        {awaitingInclude && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">
              Select ingredients to include:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {inventory.map((it, idx) => {
                const name = it.name ?? it;
                const sel = includeItems.includes(name);
                return (
                  <Button
                    key={idx}
                    variant={sel ? "selected" : "outline"}
                    className="text-sm flex items-center gap-1"
                    onClick={() =>
                      toggleItem(name, includeItems, setIncludeItems)
                    }
                  >
                    {sel ? <CheckSquare size={14} /> : <Square size={14} />}{" "}
                    {name}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button className="bg-orange-500 text-white" onClick={submitInclude}>
                Apply Inclusion
              </Button>
              <Button
                variant="ghost"
                className="text-sm flex items-center gap-1"
                onClick={() => {
                  setAwaitingInclude(false);
                  setIncludeItems([]);
                }}
              >
                <CornerUpLeft size={16} /> Back
              </Button>
            </div>
          </div>
        )}

        {/* -------- Cuisine Panel -------- */}
        {choosingCuisine && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">Select a cuisine style:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {["Italian", "Israeli", "Mexican", "Asian", "Indian", "French"].map(
                c => (
                  <Button
                    key={c}
                    className="text-sm"
                    onClick={() => submitCuisine(c.toLowerCase())}
                  >
                    {c}
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                className="text-sm text-gray-600"
                onClick={() => setChoosingCuisine(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* -------- Saved Recipes -------- */}
      {showSaved && (
        <div className="w-full max-w-4xl mt-6 bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-3">💖 Saved Recipes</h2>
          {savedRecipes.length === 0 ? (
            <p className="text-sm text-gray-500">No recipes saved yet.</p>
          ) : (
            savedRecipes.map((r, i) => {
              const open = openSavedIdx === i;
              return (
                <div
                  key={i}
                  className="border rounded p-4 mb-3 bg-gray-50"
                >
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setOpenSavedIdx(open ? null : i)}
                  >
                    <h3 className="text-orange-600 font-medium">{r.title}</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation();
                          setOpenSavedIdx(open ? null : i);
                        }}
                      >
                        {open ? "Hide" : "View"}{" "}
                        {open ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </Button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteRecipe(r.title);
                        }}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{r.description}</p>
                  {open && (
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <span className="badge">{r.difficulty}</span>
                        <span className="badge">Prep {r.prep_minutes} m</span>
                        <span className="badge">Cook {r.cook_minutes} m</span>
                        {r.servings && (
                          <span className="badge">Serves {r.servings}</span>
                        )}
                      </div>
                      <div>
                        <strong>Ingredients:</strong>
                        <ul className="list-disc ml-5">
                          {r.ingredients.map((ing, idx) => (
                            <li key={idx}>
                              {ing.qty} {ing.unit} {ing.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Instructions:</strong>
                        <ol className="list-decimal ml-5 space-y-1">
                          {r.instructions.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* -------- Profile Summary -------- */}
      {showProfile && profileData && (
        <div className="w-full max-w-4xl mt-6">
          <ProfileSummary
            userPrefs={profileData}
            inventory={inventory}
            userName={userName}
          />
        </div>
      )}

      {/* once-per-file badge styling */}
      <style jsx="true">{`
        .badge {
          @apply border rounded px-2 py-0.5 text-xs bg-gray-100;
        }
        .selected {
          @apply bg-orange-600 text-white hover:bg-orange-700;
        }
      `}</style>
    </div>
  );
}