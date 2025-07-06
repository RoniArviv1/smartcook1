import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function NutritionSummary({ userId }) {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("daily"); // "daily" or "weekly"

  useEffect(() => {
    if (!userId) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/nutrition/summary?user_id=${userId}&days=7&group=${view}`
        );
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load nutrition summary", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [userId, view]);

  const switchView = () => {
    setView(view === "daily" ? "weekly" : "daily");
  };

  if (loading) return <p className="text-sm text-gray-500">Loading nutrition summary...</p>;
  if (!summary.length) return <p className="text-sm text-gray-500">No nutrition data found.</p>;

  const avg = summary[0]?.average_per_day || {};
  const weeklyAvgChartData = {
    labels: ["Calories", "Protein", "Carbs", "Fat"],
    datasets: [
      {
        label: "Avg per day",
        data: [
          avg.calories || 0,
          avg.protein || 0,
          avg.carbs || 0,
          avg.fat || 0,
        ],
        backgroundColor: [
          "rgba(255, 159, 64, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 205, 86, 0.6)",
        ],
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded shadow max-w-md mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">
          🧾 Nutrition Summary ({view === "daily" ? "7 Days" : "Weekly Total"})
        </h2>
        <button
          onClick={switchView}
          className="text-xs text-blue-600 hover:underline"
        >
          {view === "daily" ? "View Weekly" : "View Daily"}
        </button>
      </div>

      {view === "daily" ? (
        <ul className="space-y-2 text-sm">
          {summary.map((day, index) => (
            <li key={index} className="border rounded p-2">
              <div className="font-medium mb-1">{day.date}</div>
              <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-700">
                <div>Calories: {day.calories}</div>
                <div>Protein: {day.protein} g</div>
                <div>Carbs: {day.carbs} g</div>
                <div>Fat: {day.fat} g</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="border rounded p-2 text-xs space-y-1">
            <div className="font-medium text-sm mb-1">📊 Weekly Totals</div>
            <div>Calories: {summary[0]?.total?.calories ?? 0}</div>
            <div>Protein: {summary[0]?.total?.protein ?? 0} g</div>
            <div>Carbs: {summary[0]?.total?.carbs ?? 0} g</div>
            <div>Fat: {summary[0]?.total?.fat ?? 0} g</div>
          </div>

          <div className="border rounded p-2 text-xs space-y-1 mt-2">
            <div className="font-medium text-sm mb-1">📅 Daily Averages</div>
            <div>Calories/day: {avg.calories ?? 0}</div>
            <div>Protein/day: {avg.protein ?? 0} g</div>
            <div>Carbs/day: {avg.carbs ?? 0} g</div>
            <div>Fat/day: {avg.fat ?? 0} g</div>
          </div>

          <div className="mt-4">
            <Bar data={weeklyAvgChartData} options={{ responsive: true }} />
          </div>
        </>
      )}
    </div>
  );
}
