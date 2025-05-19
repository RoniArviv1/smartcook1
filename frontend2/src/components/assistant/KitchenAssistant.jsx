import React, { useState, useRef, useEffect } from "react";
import { ChefHat, Sparkles, Apple, CornerUpLeft, CheckSquare, Square, Heart, Trash } from "lucide-react";
import Button from "../ui/button";
import ChatMessage from "./ChatMessage";
import SuggestedRecipes from "./SuggestedRecipes";
import ProfileSummary from "./ProfileSummary";
import { Link } from "react-router-dom";

const POST_RECIPE_OPTIONS = [
  "Show me another recipe",
  "Surprise me",
  "Lower calories",
  "Spicier",
  "No spice",
  "Exclude an ingredient",
  "Faster to make",
  "Choose a cuisine style"
];

export default function KitchenAssistant({
  inventory,
  userName,
  userId,
  userPrefs,
  onSendMessage
}) {
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      content: `👋 Hello${userName ? ` ${userName}` : ""}, I'm your SmartCook Assistant.\nHow can I inspire your next meal today?`
    }
  ]);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [lastRecipeIndex, setLastRecipeIndex] = useState(null);
  const [awaitingExclusion, setAwaitingExclusion] = useState(false);
  const [excludedItems, setExcludedItems] = useState([]);
  const [choosingCuisine, setChoosingCuisine] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState(() => {
    const saved = localStorage.getItem("smartcook_saved");
    return saved ? JSON.parse(saved) : [];
  });
  const [showSaved, setShowSaved] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("smartcook_saved", JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  const handleProfileClick = async () => {
    if (!showProfile) {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${userId}`);
        if (!res.ok) throw new Error(`Profile load failed: ${res.status}`);
        const data = await res.json();
        setProfileData(data);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      }
    }
    setShowProfile(!showProfile);
  };

  const handleStartRecipeFlow = async () => {
    const userMessage = "Get me a recipe using my preferences and ingredients.";
    await sendUserMessage(userMessage);
  };

  const sendUserMessage = async (userMessage) => {
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    const response = await onSendMessage(userMessage, messages.slice(-4));
    setMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content: response.response || "Sorry, something went wrong.",
        suggestedRecipes: response.recipes || []
      }
    ]);
    if (response.recipes?.length) {
      setLastRecipeIndex(messages.length + 1);
    }
  };

  const handlePostRecipeOption = async (option) => {
    if (option === "Exclude an ingredient") {
      setAwaitingExclusion(true);
      return;
    }

    if (option === "Choose a cuisine style") {
      setChoosingCuisine(true);
      return;
    }

    let userMessage = "";
    switch (option) {
      case "Show me another recipe":
        userMessage = "Please suggest a completely different recipe based on my preferences.";
        break;
      case "Surprise me":
        userMessage = "Surprise me with something unexpected and creative using my preferences.";
        break;
      case "Lower calories":
        userMessage = "Please suggest a lower-calorie version of the last recipe.";
        break;
      case "Spicier":
        userMessage = "Please make the last recipe spicier by adding suitable spices.";
        break;
      case "No spice":
        userMessage = "Please make the last recipe mild, removing or avoiding spicy ingredients.";
        break;
      case "Make it plant-based":
        userMessage = "Please convert the last recipe to be fully plant-based (vegan).";
        break;
      case "Faster to make":
        userMessage = "Please make the last recipe quicker to prepare and cook.";
        break;
      default:
        userMessage = `Please revise the last recipe: ${option}`;
    }

    await sendUserMessage(userMessage);
  };

  const handleIngredientToggle = (ingredient) => {
    setExcludedItems((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleExcludeSubmit = async () => {
    if (!excludedItems.length) return;
    const userMessage = `Please adjust the last recipe to exclude: ${excludedItems.join(", ")}.`;
    setAwaitingExclusion(false);
    setExcludedItems([]);
    await sendUserMessage(userMessage);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.type === "user")?.content;
    if (lastUserMsg) {
      sendUserMessage(lastUserMsg);
    }
  };

  const handleSaveRecipe = (recipe) => {
    const alreadySaved = savedRecipes.some((r) => r.title === recipe.title);
    if (!alreadySaved) {
      setSavedRecipes((prev) => [...prev, recipe]);
    }
  };

  const handleDeleteSaved = (title) => {
    setSavedRecipes((prev) => prev.filter((r) => r.title !== title));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col items-center p-6">
      <header className="w-full max-w-4xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gray-200 p-2 rounded-full">
            <ChefHat className="w-5 h-5 text-gray-700" />
          </div>
          <h1 className="text-2xl font-light text-gray-800">SmartCook Assistant</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleProfileClick}>
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

      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <ChatMessage message={msg} onRetry={handleRetry} />
              {msg.suggestedRecipes && (
                <SuggestedRecipes recipes={msg.suggestedRecipes} onSave={handleSaveRecipe} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && messages[0].type === "assistant" && (
          <div className="p-6 flex justify-center">
            <Button
              onClick={handleStartRecipeFlow}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-lg"
            >
              Get me a recipe using my preferences and ingredients
            </Button>
          </div>
        )}

        {lastRecipeIndex !== null && messages.some((msg) => msg.suggestedRecipes?.length) && !awaitingExclusion && !choosingCuisine && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">What would you like to do next?</p>
            <div className="flex flex-wrap gap-2">
              {POST_RECIPE_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  onClick={() => handlePostRecipeOption(opt)}
                  variant="outline"
                  className="text-sm"
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {choosingCuisine && (
          <div className="border-t p-4 bg-gray-50 w-full max-w-4xl">
            <p className="text-sm text-gray-600 mb-2">Select a cuisine style:</p>
            <div className="flex flex-wrap gap-2">
              {["Italian", "Israeli", "Mexican", "Asian", "Indian", "French"].map((style) => (
                <Button
                  key={style}
                  className="text-sm"
                  onClick={async () => {
                    setChoosingCuisine(false);
                    await sendUserMessage(`Please suggest a ${style.toLowerCase()} style recipe using my preferences.`);
                  }}
                >
                  {style}
                </Button>
              ))}
              <Button
                variant="ghost"
                onClick={() => setChoosingCuisine(false)}
                className="text-sm text-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {awaitingExclusion && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">Select ingredients to exclude:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {inventory.map((item, idx) => {
                const name = item.name || item;
                const selected = excludedItems.includes(name);
                return (
                  <Button
                    key={idx}
                    onClick={() => handleIngredientToggle(name)}
                    variant={selected ? "default" : "secondary"}
                    className="text-sm flex items-center gap-1"
                  >
                    {selected ? <CheckSquare size={14} /> : <Square size={14} />} {name}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExcludeSubmit} className="bg-orange-500 text-white">
                Apply Exclusion
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAwaitingExclusion(false);
                  setExcludedItems([]);
                }}
                className="text-sm flex items-center gap-1 text-gray-600"
              >
                <CornerUpLeft size={16} /> Back to options
              </Button>
            </div>
          </div>
        )}
      </div>

      {showSaved && (
        <div className="w-full max-w-4xl mt-6 bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-3">💖 Saved Recipes</h2>
          {savedRecipes.length === 0 ? (
            <p className="text-sm text-gray-500">No recipes saved yet.</p>
          ) : (
            savedRecipes.map((recipe, i) => (
              <div key={i} className="border rounded p-4 mb-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-orange-600 font-medium">{recipe.title}</h3>
                  <button
                    onClick={() => handleDeleteSaved(recipe.title)}
                    className="text-gray-500 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{recipe.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {showProfile && profileData && (
        <div className="w-full max-w-4xl mt-6">
          <ProfileSummary
            userPrefs={profileData}
            inventory={inventory}
            userName={userName}
          />
        </div>
      )}
    </div>
  );
}