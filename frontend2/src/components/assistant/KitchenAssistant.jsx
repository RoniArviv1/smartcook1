import { API_BASE } from "../../utils/api";
// ייבוא של React וכלים נלווים לניהול state, אפקטים ו־ref
import React, { useState, useRef, useEffect } from "react";

// ייבוא אייקונים מ־lucide-react (אייקונים SVG מודרניים ונקיים)
import {
  ChefHat, Sparkles, Apple, CornerUpLeft,
  CheckSquare, Square, Heart, Trash,
  ChevronDown, ChevronUp, Timer, Users
} from "lucide-react";

// קומפוננטות פנימיות שמשמשות בתצוגת העוזר
import Button from "../ui/button";                       // כפתור מעוצב
import ChatMessage from "./ChatMessage";                 // הודעה בצ'אט
import SuggestedRecipes from "./SuggestedRecipes";       // תצוגת מתכונים
import { Link } from "react-router-dom";                 // קישורים פנימיים באפליקציה

const token = localStorage.getItem("token");

// הגדרות עבור סוגי התאמות שהמשתמש יכול לבחור
const MULTI_OPTS   = ["Lower calories", "Faster to make"];       // אפשרויות מרובות – ניתן לבחור יותר מאחת
const INSTANT_OPTS = ["Show me another recipe", "Surprise me"];  // כפתורים של בקשה מיידית
const FLOW_OPTS    = [
  "Exclude an ingredient",            // תהליך: לבחור רכיבים להחרגה
  "Must include an ingredient",       // תהליך: לבחור רכיבים חובה
  "Choose a cuisine style"            // תהליך: לבחור סגנון מטבח (איטלקי, אסייתי וכו')
];

// מיפוי בין שם כפתור לבין הטקסט המלא שישלח למודל השפה
const SINGLE_MAP = {
  "Show me another recipe":
    "Please suggest a completely different recipe based on my preferences.",
  "Surprise me":
    "Surprise me with something unexpected and creative using my preferences."
};

// הקומפוננטה הראשית – KitchenAssistant
export default function KitchenAssistant({
  inventory,          // רשימת הרכיבים במלאי המשתמש
  userName,           // שם המשתמש (אופציונלי – לצורך פנייה אישית)
  userId,             // מזהה המשתמש (משמש לשליפה/שמירה של מתכונים)
  onSendMessage,      // פונקציה שנשלחת מההורה – שולחת הודעה לעוזר
  useExpiring,        // האם להעדיף רכיבים שפג תוקפם בקרוב
  setUseExpiring      // פונקציה לשינוי useExpiring
}) {
  // מצב ההודעות בצ'אט – מתחיל בהודעת פתיחה מהעוזר
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      content: `👋 Hello${userName ? ` ${userName}` : ""}, I'm your SmartCook Assistant.\nHow can I inspire your next meal today?`
    }
  ]);

  const [lastRecipeIndex, setLastRecipeIndex] = useState(null); 
  // מאחסן את אינדקס ההודעה האחרונה שכוללת מתכון – כדי לדעת מתי להציע התאמות

  const messagesEndRef = useRef(null); 
  // רפרנס לתחתית רשימת ההודעות – מאפשר לגלול אוטומטית לצ'אט האחרון (scrollIntoView)

  // מצב שבו המשתמש בוחר התאמות לפני שליחת בקשה חדשה
  const [pendingOpts, setPendingOpts] = useState([]);       // אופציות שנבחרו כרגע (למשל: Lower calories)
  const [spiceState,  setSpiceState]  = useState("none");   // מצב חריפות: "none" | "more" | "mild"

  // מצב של החרגת רכיבים
  const [awaitingExclusion, setAwaitingExclusion] = useState(false);  // האם מוצג מסך להוצאת רכיבים
  const [excludedItems,     setExcludedItems]     = useState([]);     // רשימת רכיבים שהמשתמש רוצה להחריג

  // מצב של הכללת רכיבים חובה
  const [awaitingInclude,   setAwaitingInclude]   = useState(false);  // האם מוצג מסך להוספת רכיבים
  const [includeItems,      setIncludeItems]      = useState([]);     // רשימת רכיבים שהמשתמש רוצה לכלול

  // מצב של בחירת סגנון מטבח
  const [choosingCuisine,   setChoosingCuisine]   = useState(false);  // האם המשתמש בוחר סגנון כעת
  const [selectedCuisine,   setSelectedCuisine]   = useState(null);   // הסגנון שנבחר (למשל "italian")

  // מתכונים שנשמרו ע"י המשתמש
  const [savedRecipes, setSavedRecipes] = useState([]);       // רשימת מתכונים שנשמרו מהשרת
  const [showSaved,    setShowSaved]    = useState(false);    // האם להציג את הלשונית של המתכונים השמורים
  const [openSavedIdx, setOpenSavedIdx] = useState(null);     // אם פתחתי מתכון – איזה מהם פתוח כרגע

  const [mealType, setMealType] = useState(null);             // בוקר / צהריים / ערב (משפיע על המלצה)
// 📡 שליפת מתכונים שמורים מהשרת בעת טעינת הקומפוננטה (או שינוי userId)
useEffect(() => {
  if (!token) return;
  fetch(`${API_BASE}/api/recipes/saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })  // מבצע קריאה לשרת לפי מזהה המשתמש
    .then(res => res.json())              // ממיר את התגובה ל־JSON
    .then(setSavedRecipes)                // שומר את המתכונים בסטייט
    .catch(console.error);                // במקרה של שגיאה – מציג בקונסול
}, [token]);  // תלוי ב־userId – רץ שוב רק אם המשתמש מתחלף

// 🔽 גלילה אוטומטית לתחתית הצ'אט בכל פעם שההודעות משתנות
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });  // מבצע גלילה רכה לתחתית
}, [messages]);  // רץ בכל שינוי במספר או תוכן ההודעות

// 💾 שמירה של רשימת המתכונים השמורים ל־localStorage בדפדפן
useEffect(() => {
  localStorage.setItem("smartcook_saved", JSON.stringify(savedRecipes));  // המרה למחרוזת ושמירה
}, [savedRecipes]);  // רץ בכל פעם שרשימת המתכונים משתנה

// 🧠 בניית מחרוזת טקסט שמתארת את כל ההתאמות שנבחרו (לשליחה למודל)
const buildMods = () => {
  const parts = [];

  if (pendingOpts.length)
    parts.push(pendingOpts.map(o => o.toLowerCase()).join(" and "));  // לדוגמה: "lower calories and faster to make"

  if (spiceState === "more") parts.push("spicier");       // חריף יותר
  if (spiceState === "mild") parts.push("mild (no spice)"); // לא חריף בכלל

  if (excludedItems.length)
    parts.push(`exclude: ${excludedItems.join(", ")}`);    // רכיבים להחרגה

  if (includeItems.length)
    parts.push(`MUST include: ${includeItems.join(", ")}`); // רכיבים שחייבים להיכלל

  if (mealType)
    parts.push(`suitable for ${mealType}`);                // סוג ארוחה (בוקר/צהריים/ערב)

  if (selectedCuisine)
    parts.push(`in a ${selectedCuisine} style`);           // סגנון המטבח

  return parts.join(" and ");  // מחבר את כל החלקים לטקסט רציף
};

// 🧼 איפוס של כל ההתאמות החכמות (לא כולל רכיבים להחרגה או הכללה)
const resetMods = () => {
  setPendingOpts([]);     // אופציות כמו "Lower calories"
  setSpiceState("none");  // מחיקת בחירת חריפות
  setMealType(null);      // ביטול בחירת סוג ארוחה
};

// 📤 שליחת הודעה מהמשתמש לעוזר
const sendUserMessage = async (msg) => {
  // אם אין מלאי בכלל – לא ניתן להציע מתכונים
  if (!inventory || inventory.length === 0) {
    setMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content:
          "🫑 It looks like your ingredient list is empty. Please add some ingredients to your inventory so I can recommend a recipe 😊",
      },
    ]);
    return;
  }

  // מוסיף את הודעת המשתמש לרשימת ההודעות
  setMessages(prev => [...prev, { type: "user", content: msg }]);

  // שולח את ההודעה לפונקציה שמתקשרת עם ה־backend או מודל השפה
  const res = await onSendMessage(msg, messages.slice(-4));  // שולח גם את 4 ההודעות האחרונות (קונטקסט)

  // מוסיף את תגובת העוזר לצ'אט
  setMessages(prev => [
    ...prev,
    {
      type: "assistant",
      content: res.response || "Sorry, something went wrong.",     // הודעת fallback במקרה של שגיאה
      suggestedRecipes: res.recipes || []                          // מצרף מתכונים אם יש
    }
  ]);

  // אם יש מתכונים בתגובה – שומר את מיקום ההודעה בצ'אט
  if (res.recipes?.length) setLastRecipeIndex(messages.length + 1);
};

// ✅ החלת ההתאמות שנבחרו ע"י המשתמש (כמו חריפות, סוג ארוחה, וכו')
const applyPending = async () => {
  const mods = buildMods();  // בונה מחרוזת תיאור של ההתאמות
  if (!mods) return;         // אם לא נבחר כלום – לא שולח כלום

  // בדיקה האם מדובר באופציה מהירה כמו "Surprise me"
  const isInstant =
    pendingOpts.length === 1 &&
    spiceState === "none" &&
    excludedItems.length === 0 &&
    includeItems.length === 0 &&
    !mealType &&
    !selectedCuisine &&
    INSTANT_OPTS.includes(pendingOpts[0]);

  if (isInstant) {
    // שולח בקשה מוכנה מראש לפי המיפוי
    await sendUserMessage(SINGLE_MAP[pendingOpts[0]]);
  } else {
    // שולח בקשה מורכבת עם כל ההתאמות שנבנו
    await sendUserMessage(`Please make the last recipe ${mods}.`);
  }

  // איפוס של כל ההתאמות אחרי השליחה
  resetMods();
  setExcludedItems([]);
  setIncludeItems([]);
  setSelectedCuisine(null);
};

// ❌ ביטול ההתאמות – מחזיר את כל ההגדרות לברירת מחדל
const cancelPending = () => {
  resetMods();            // מאפס spice + mealType + pendingOpts
  setExcludedItems([]);   // מאפס החרגות
  setIncludeItems([]);    // מאפס הכללות
};

// ✅ אישור רשימת רכיבים להחרגה
const submitExclude = async () => {
  if (!excludedItems.length) return;  // אם לא נבחר כלום – יוצא

  // רכיבים שלא ניתן לבשל מהם לבד – אם רק הם נשארים, נזהיר את המשתמש
  const NON_STANDALONE_INGREDIENTS = [
    "butter", "salt", "pepper", "oil", "spices", "sugar", "water"
  ];

  // מחשב מה נשאר אחרי ההחרגה
  const remainingIngredients = inventory
    .map(it => it.name.toLowerCase())
    .filter(name => !excludedItems.map(e => e.toLowerCase()).includes(name))  // מסנן את המוחרגים
    .filter(name => !NON_STANDALONE_INGREDIENTS.includes(name));             // מסנן מרכיבים שאי אפשר להשתמש בהם לבד

  if (remainingIngredients.length === 0) {
    // אם לא נשאר שום דבר רלוונטי – מזהיר את המשתמש
    setMessages(prev => [
      ...prev,
      {
        type: "assistant",
        content:
          "❗ After excluding ingredients, only unusable items remain (like butter or spices). Please keep at least one usable ingredient for a proper recipe.",
      },
    ]);
    setAwaitingExclusion(false);  // סוגר את מצב ההחרגה
    setExcludedItems([]);         // מאפס את הבחירה
    return;
  }

  // אם הכול תקין – סוגר את ממשק ההחרגה
  setAwaitingExclusion(false);
};

// ✅ אישור של רכיבים חובה שהמשתמש הוסיף
const submitInclude = async () => {
  if (!includeItems.length) return;   // אם לא נבחר כלום – יוצא
  setAwaitingInclude(false);         // סוגר את ממשק ההוספה
};

// ✅ אישור סגנון מטבח שנבחר
const submitCuisine = async () => {
  if (!selectedCuisine) return;      // אם לא נבחר כלום – לא עושה כלום
  setChoosingCuisine(false);         // סוגר את התפריט
};

// 🔁 הוספה או הסרה של אופציה ברשימת ההתאמות (כמו "Lower calories")
const togglePending = (opt) =>
  setPendingOpts(prev =>
    prev.includes(opt)
      ? prev.filter(o => o !== opt)   // אם כבר נבחר – מסיר
      : [...prev, opt]                // אחרת – מוסיף
  );

// 🔁 הוספה או הסרה של רכיב מתוך רשימה כללית (משמש גם ל־exclude וגם ל־include)
const toggleItem = (name, list, setter) =>
  setter(
    list.includes(name)
      ? list.filter(i => i !== name)  // אם כבר ברשימה – מסיר
      : [...list, name]               // אחרת – מוסיף
  );

// 💾 שמירת מתכון לשרת דרך POST
const saveRecipe = async (r) => {
  try {
    const res = await fetch(`${API_BASE}/api/recipes/saved`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" ,
        "Authorization": `Bearer ${token}` // מוסיפים את המפתח כאן
    },
      body: JSON.stringify(r),  // שולח את כל המתכון כ־JSON
    });
    if (res.ok) {
      // אם הצליח – מוסיף לסטייט של המתכונים השמורים
      setSavedRecipes(prev => [...prev, r]);
    } else {
      console.error("❌ Failed to save recipe");
    }
  } catch (err) {
    console.error("❌ Error saving recipe:", err);  // שגיאה כללית – בעיה ברשת/שרת
  }
};

// 🗑️ מחיקת מתכון מהשרת ומהסטייט (DELETE)
const deleteRecipe = async (title) => {
  try {
    const res = await fetch(`${API_BASE}/api/recipes/saved`, {
      method: "DELETE",
      headers: {
         "Content-Type": "application/json" ,
         "Authorization": `Bearer ${token}` // מוסיפים את המפתח כאן
    },
      body: JSON.stringify({ title }),  // שולח רק את שם המתכון למחיקה
    });
    if (res.ok) {
      // אם הצליח – מסנן את המתכון מתוך הסטייט
      setSavedRecipes(savedRecipes.filter((r) => r.title !== title));
    } else {
      console.error("❌ Failed to delete from server");
    }
  } catch (err) {
    console.error("❌ Failed to delete recipe:", err);  // שגיאה כללית
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
        <div className="flex gap-2 items-center">
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
                {/* Meal Type selector */}
                <div className="w-full mt-4">
                  <p className="text-sm text-gray-600 mb-1">Meal time preference:</p>
                  <div className="flex gap-2">
                    {["breakfast", "lunch", "dinner"].map(meal => {
                      const capitalized = meal.charAt(0).toUpperCase() + meal.slice(1);
                      const selected = mealType === meal;
                      return (
                        <Button
                          key={meal}
                          variant={selected ? "selected" : "outline"}
                          className="text-sm flex items-center gap-1"
                          onClick={() => setMealType(selected ? null : meal)} // לחיצה שנייה מבטלת
                        >
                          {selected && "✔︎"} {capitalized}
                        </Button>
                      );
                    })}
                  </div>
                </div>


                {/* Expiring*/}
                <div className="w-full mt-4 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useExpiring"
                      checked={useExpiring}
                      onChange={() => setUseExpiring(!useExpiring)}
                      className="accent-orange-500"
                    />
                    <label htmlFor="useExpiring" className="text-sm text-gray-700">
                      Use ingredients that are about to expire
                    </label>
                  </div>
                </div>


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
                    {sel ? <CheckSquare size={14} /> : <Square size={14} />} {name}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-orange-500 text-white"
                onClick={submitInclude} // לא שולח שום הודעה, רק סוגר את הפאנל
              >
                Done
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
                    className={`text-sm ${
                      selectedCuisine === c.toLowerCase() ? "selected" : ""
                    }`}
                    onClick={() => setSelectedCuisine(
                      selectedCuisine === c.toLowerCase() ? null : c.toLowerCase()
                    )}
                  >
                    {selectedCuisine === c.toLowerCase() && "✔︎"} {c}
                  </Button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-orange-500 text-white"
                onClick={submitCuisine}
                disabled={!selectedCuisine}
              >
                Apply
              </Button>
              <Button
                variant="ghost"
                className="text-sm flex items-center gap-1"
                onClick={() => {
                  setChoosingCuisine(false);
                  setSelectedCuisine(null);
                }}
              >
                <CornerUpLeft size={16} /> Back
              </Button>
            </div>
          </div>
        )}


      </div>

      {/* -------- Saved Recipes -------- */}
      {showSaved && (
        <div className="w-full max-w-4xl mt-6 bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">💖 Saved Recipes</h2>

          {savedRecipes.length === 0 ? (
            <p className="text-sm text-gray-500">No recipes saved yet.</p>
          ) : (
            savedRecipes.map((r, i) => {
              const open = openSavedIdx === i;
              return (
                <div
                  key={i}
                  className="border rounded-lg p-5 mb-5 bg-gray-50 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-orange-600 text-lg font-semibold">{r.title}</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenSavedIdx(open ? null : i);
                        }}
                      >
                        {open ? "Hide" : "View"} {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </Button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecipe(r.title);
                        }}
                        className="text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-1">{r.description}</p>

                  {/* Expanded content */}
                  {open && (
                    <div className="mt-4 space-y-4 text-sm text-gray-800">
                      {/* Meta details */}
                      <div className="flex flex-wrap gap-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <ChefHat size={16} /> <span>{r.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer size={16} /> <span>Prep: {r.prep_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer size={16} /> <span>Cook: {r.cook_minutes} min</span>
                        </div>
                        {r.servings && (
                          <div className="flex items-center gap-1">
                            <Users size={16} /> <span>Serves: {r.servings}</span>
                          </div>
                        )}
                      </div>

                      {/* Ingredients */}
                      <div>
                        <h4 className="font-semibold mb-1">🧂 Ingredients:</h4>
                        <ul className="list-disc list-inside pl-2">
                          {r.ingredients.map((ing, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{ing.name}</span>: {ing.quantity} {ing.unit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Instructions */}
                      <div>
                        <h4 className="font-semibold mb-1">👨‍🍳 Instructions:</h4>
                        <ol className="list-decimal list-inside space-y-1 pl-2">
                          {r.instructions.map((step, idx) => (
                            <li key={idx}>{step}</li>
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