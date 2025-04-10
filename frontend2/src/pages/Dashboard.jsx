import React, { useEffect, useState } from "react";
import RecommendedRecipes from "../components/dashboard/RecommendedRecipes";
import TopRecipes from "../components/dashboard/TopRecipes";
import InventoryStatus from "../components/dashboard/InventoryStatus";

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
    <div style={{ padding: "20px" }}>
      <h1>🍳 Welcome to SmartCook</h1>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        <div>
          <RecommendedRecipes 
            recipes={recipes}
            userPrefs={userPrefs}
            inventory={inventory}
            loading={loading}
          />

          <TopRecipes 
            recipes={topRecipes}
            loading={loading}
          />
        </div>

        <div>
          <InventoryStatus 
            inventory={inventory}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}