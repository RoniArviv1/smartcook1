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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 text-gray-800 font-sans">
        
        {/* Navigation Bar */}
        <nav className="bg-white/80 backdrop-blur shadow-md px-6 py-4 sticky top-0 z-50">
          <ul className="flex gap-6 justify-center">
            <li>
              <NavLink 
                to="/" 
                end
                className={({ isActive }) =>
                  isActive 
                    ? "font-bold text-pink-500 border-b-2 border-pink-400 pb-1" 
                    : "hover:text-pink-400 transition"
                }
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/inventory"
                className={({ isActive }) =>
                  isActive 
                    ? "font-bold text-blue-500 border-b-2 border-blue-400 pb-1" 
                    : "hover:text-blue-400 transition"
                }
              >
                Inventory
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/profile"
                className={({ isActive }) =>
                  isActive 
                    ? "font-bold text-green-500 border-b-2 border-green-400 pb-1" 
                    : "hover:text-green-400 transition"
                }
              >
                Profile
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/assistant"
                className={({ isActive }) =>
                  isActive 
                    ? "font-bold text-purple-500 border-b-2 border-purple-400 pb-1" 
                    : "hover:text-purple-400 transition"
                }
              >
                Assistant
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Page Content */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/assistant" element={<Assistant />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}