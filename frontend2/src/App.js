import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import Assistant from "./pages/Assistant";

function NavigationBar({ isLoggedIn, username, handleLogout }) {
  return (
    <nav className="bg-white/80 backdrop-blur shadow-md px-6 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        <ul className="flex gap-6">
          {isLoggedIn && (
            <>
              <li><NavLink to="/" end className={({ isActive }) => isActive ? "font-bold text-pink-500 border-b-2 border-pink-400 pb-1" : "hover:text-pink-400 transition"}>Dashboard</NavLink></li>
              <li><NavLink to="/inventory" className={({ isActive }) => isActive ? "font-bold text-blue-500 border-b-2 border-blue-400 pb-1" : "hover:text-blue-400 transition"}>Inventory</NavLink></li>
              <li><NavLink to="/profile" className={({ isActive }) => isActive ? "font-bold text-green-500 border-b-2 border-green-400 pb-1" : "hover:text-green-400 transition"}>Profile</NavLink></li>
              <li><NavLink to="/assistant" className={({ isActive }) => isActive ? "font-bold text-purple-500 border-b-2 border-purple-400 pb-1" : "hover:text-purple-400 transition"}>Assistant</NavLink></li>
            </>
          )}
        </ul>
        <div className="flex gap-4 items-center">
          {!isLoggedIn ? (
            <>
              <NavLink to="/login" className="text-sm text-gray-600 hover:text-blue-500">Login</NavLink>
              <NavLink to="/register" className="text-sm text-gray-600 hover:text-green-500">Register</NavLink>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-700">👋 Hello, {username}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("username");
    setIsLoggedIn(!!token);
    setUsername(name || "");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUsername("");
    window.location.href = "/login";
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 text-gray-800 font-sans">
        <NavigationBar isLoggedIn={isLoggedIn} username={username} handleLogout={handleLogout} />
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
