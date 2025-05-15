// src/components/assistant/ProfileSummary.jsx
import React, { useEffect, useState } from "react";
import { Apple, AlertTriangle, UserCircle2, Heart } from "lucide-react";
import { differenceInDays } from "date-fns";

/**
 * props
 * -----
 * userPrefs : Object | null  ←  העדפות שמגיעות מההורה
 * inventory : Array          ←  רשימת המצרכים
 * userName  : string         ←  שם המשתמש
 *
 * (רשות)   loadPrefs : bool ←  אם true, יטען בעצמו מ־/api/profile/<userId>
 * (רשות)   userId    : int  ←  נחוץ רק אם loadPrefs=true
 */
export default function ProfileSummary({
  userPrefs,
  inventory,
  userName,
  loadPrefs = false,
  userId
}) {
  /* טעינה עצמית – רק אם ביקשנו מפורשות */
  const [prefs, setPrefs] = useState(userPrefs);
  useEffect(() => setPrefs(userPrefs), [userPrefs]);

  useEffect(() => {
    if (!loadPrefs) return;

    const fetchPrefs = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${userId}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        setPrefs(data);
      } catch (err) {
        console.error("Failed to load user preferences:", err);
      }
    };
    fetchPrefs();
  }, [loadPrefs, userId]);

  /* ------------- פונקציות עזר ------------- */
  const expiringSoon = () =>
    inventory
      .filter((i) => i.expiry_date)
      .filter(
        (i) =>
          differenceInDays(new Date(i.expiry_date), new Date()) <= 3
      );

  const allergyList = () => {
    if (!prefs) return [];
    const base = prefs.allergies || [];
    const custom =
      prefs.custom_allergies?.split(",").map((s) => s.trim()) || [];
    return [...base, ...custom].filter(Boolean);
  };

  /* טעינה? */
  if (!prefs) return <p>Loading profile…</p>;

  /* ---------------------------------------------------- */
  /*                   JSX Starts Here                    */
  /* ---------------------------------------------------- */
  return (
    <div className="m-4 bg-gray-50 border border-dashed rounded-lg p-4">
      {/* פרטי משתמש + הרגלי תזונה */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* --- Profile Info --- */}
        <section>
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <UserCircle2 className="w-4 h-4" />
            Profile
          </h3>
          <ul className="text-sm leading-relaxed">
            <li>
              <span className="text-gray-500">Name:</span>{" "}
              {userName || "User"}
            </li>
            <li>
              <span className="text-gray-500">Cooking Level:</span>{" "}
              {prefs.cooking_skill || "Not specified"}
            </li>
            <li>
              <span className="text-gray-500">Meal Preference:</span>{" "}
              {prefs.meal_preference || "Not specified"}
            </li>
          </ul>
        </section>

        {/* --- Dietary & Allergy --- */}
        <section>
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4" />
            Dietary Preferences
          </h3>

          {/* Dietary Tags */}
          <div className="flex flex-wrap gap-2">
            {prefs.dietary_restrictions?.length ? (
              prefs.dietary_restrictions.map((tag) => (
                <span
                  key={tag}
                  className="bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-xs capitalize"
                >
                  {tag.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">
                No dietary restrictions specified
              </span>
            )}
          </div>

          {/* Allergies */}
          <h4 className="mt-4 mb-1 font-medium text-sm">Allergies:</h4>
          <div className="flex flex-wrap gap-2">
            {allergyList().length ? (
              allergyList().map((a) => (
                <span
                  key={a}
                  className="bg-red-50 border border-red-300 text-red-700 rounded px-2 py-1 text-xs"
                >
                  {a}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">
                No allergies specified
              </span>
            )}
          </div>
        </section>
      </div>

      {/* --- Expiring Soon --- */}
      <section className="mt-6">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4" />
          Expiring Soon
        </h3>
        <div className="flex flex-wrap gap-2">
          {expiringSoon().length ? (
            expiringSoon().map((ing) => (
              <span
                key={ing.id}
                className="bg-yellow-50 border border-yellow-300 text-amber-800 rounded px-2 py-1 text-xs flex items-center gap-1"
              >
                <Apple className="w-3 h-3" />
                {ing.name}
                <span className="text-[10px]">
                  (
                  {differenceInDays(
                    new Date(ing.expiry_date),
                    new Date()
                  )}{" "}
                  days)
                </span>
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">
              No ingredients expiring soon
            </span>
          )}
        </div>
      </section>
    </div>
  );
}