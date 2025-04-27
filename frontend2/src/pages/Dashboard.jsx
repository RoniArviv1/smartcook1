import React, { useEffect, useState } from "react";
import RecommendedRecipes from "../components/dashboard/RecommendedRecipes";
import TopRecipes from "../components/dashboard/TopRecipes";
import InventoryStatus from "../components/dashboard/InventoryStatus";
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [userPrefs, setUserPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [recipesRes, topRes, prefsRes, inventoryRes] = await Promise.all([
        fetch("http://localhost:5000/api/recommendations"),
        fetch("http://localhost:5000/api/top-recipes"),
        fetch("http://localhost:5000/api/profile"),
        fetch("http://localhost:5000/api/inventory")
      ]);

      const [recipesData, topData, prefsData, inventoryData] = await Promise.all([
        recipesRes.json(),
        topRes.json(),
        prefsRes.json(),
        inventoryRes.json()
      ]);

      setRecipes(recipesData);
      setTopRecipes(topData);
      setUserPrefs(prefsData);
      setInventory(inventoryData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.h1 
        className="text-4xl font-bold text-pink-400 mb-8 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        🍳 Welcome to SmartCook
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/70 rounded-xl p-6 shadow">
            <RecommendedRecipes 
              recipes={recipes}
              userPrefs={userPrefs}
              inventory={inventory}
              loading={loading}
            />
          </div>

          <div className="bg-white/70 rounded-xl p-6 shadow">
            <TopRecipes 
              recipes={topRecipes}
              loading={loading}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white/70 rounded-xl p-6 shadow">
          <InventoryStatus 
            inventory={inventory}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
