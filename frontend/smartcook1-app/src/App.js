import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import Assistant from "./pages/Assistant";

export default function App() {
  return (
    <Router>
      <div>
        {/* Navigation bar */}
        <nav style={{ padding: "1rem", backgroundColor: "#f8fafc", borderBottom: "1px solid #ddd" }}>
          <ul style={{ display: "flex", gap: "1rem", listStyle: "none", margin: 0 }}>
            {/* Active link will have a bold style */}
            <li><NavLink to="/" end style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>Dashboard</NavLink></li>
            <li><NavLink to="/inventory" style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>Inventory</NavLink></li>
            <li><NavLink to="/profile" style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>Profile</NavLink></li>
            <li><NavLink to="/assistant" style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>Assistant</NavLink></li>
          </ul>
        </nav>

        {/* Page routes */}
        <div style={{ padding: "2rem" }}>
          <Routes>
            {/* Home route */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} /> {/* Optional, you can remove if not needed */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/assistant" element={<Assistant />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
