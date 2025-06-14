import React, { useEffect, useState } from "react";
import RecommendedRecipes from "../components/dashboard/RecommendedRecipes";
import InventoryStatus from "../components/dashboard/InventoryStatus";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [userPrefs, setUserPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem("smartcookUser") || "{}");
  const userId = storedUser.user_id || 1;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [recipesRes, prefsRes, inventoryRes] = await Promise.all([
        fetch(`http://localhost:5000/api/recipes/recommended/${userId}`),
        fetch(`http://localhost:5000/api/profile/${userId}`),
        fetch(`http://localhost:5000/api/inventory/${userId}`)
      ]);

      if (![recipesRes, prefsRes, inventoryRes].every(r => r.ok)) {
        throw new Error("One or more API requests failed.");
      }

      const [recipesData, prefsData, inventoryData] = await Promise.all([
        recipesRes.json(),
        prefsRes.json(),
        inventoryRes.json()
      ]);

      setRecipes(Array.isArray(recipesData.recipes) ? recipesData.recipes : []);
      setUserPrefs(prefsData);

      const rawInventory = inventoryData.inventory || [];
      const cleanedInventory = rawInventory.map((item) => ({
        ...item,
        expiration_date: item.expiration_date || item.expiry_date || null
      }));

      console.log("✅ Inventory loaded:", cleanedInventory);
      setInventory(cleanedInventory);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    try {
      await fetch(`http://localhost:5000/api/assistant/refresh/${userId}`, {
        method: "POST"
      });
      loadDashboardData();
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to SmartCook</h1>

      <button
        onClick={refreshRecommendations}
        className="mb-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
      >
        🔄 Refresh Recommendations
      </button>

      <RecommendedRecipes recipes={recipes} loading={loading} userId={userId} />
      <InventoryStatus inventory={inventory} loading={loading} />
    </div>
  );
}
