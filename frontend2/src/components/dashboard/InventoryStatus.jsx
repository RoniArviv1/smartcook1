import React from "react";
import { differenceInDays } from "date-fns";
import { Apple, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function InventoryStatus({ inventory, loading }) {
  const getExpiringIngredients = () => {
    return inventory
      .filter((ing) => ing.expiry_date)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      .slice(0, 5);
  };

  const getLowStock = () => {
    return inventory.filter((ing) => ing.quantity <= 2).slice(0, 5);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Expiring Soon */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>Expiring Soon</h3>
        {loading ? (
          <p>Loading...</p>
        ) : getExpiringIngredients().length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {getExpiringIngredients().map((ing) => {
              const daysLeft = differenceInDays(new Date(ing.expiry_date), new Date());
              return (
                <li key={ing.id} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                  <span><Apple className="inline w-4 h-4" /> {ing.name}</span>
                  <span style={{ color: daysLeft <= 2 ? "red" : "gray" }}>
                    {daysLeft} days left
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ color: "#777" }}>No ingredients expiring soon</p>
        )}
      </div>

      {/* Low Stock */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>Low Stock</h3>
        {loading ? (
          <p>Loading...</p>
        ) : getLowStock().length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {getLowStock().map((ing) => (
              <li key={ing.id} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span><Apple className="inline w-4 h-4" /> {ing.name}</span>
                <span style={{ color: "#555" }}>
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#777" }}>No ingredients in low stock</p>
        )}
      </div>

      {/* Link to inventory */}
      <Link to="/inventory">
        <button
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#f97316",
            color: "white",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          Manage Inventory
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </Link>
    </div>
  );
}
