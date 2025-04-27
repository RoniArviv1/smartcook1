import React, { useState, useRef, useEffect } from 'react';
import { Input } from "../ui/input";
import Button from "../ui/button";
import { Send, ChefHat, Sparkles, Apple } from "lucide-react";
import ChatMessage from "./ChatMessage";
import SuggestedRecipes from "./SuggestedRecipes";
import ProfileSummary from "./ProfileSummary";

const EXAMPLE_QUESTIONS = [
  "What can I cook with the ingredients I have?",
  "Suggest a quick healthy dinner",
  "How do I make a sauce with these ingredients?",
  "What's expiring soon and how can I use it?"
];

export default function KitchenAssistant({ inventory, userName, onSendMessage }) {
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      content: `👋 Hello${userName ? ` ${userName}` : ''}, I'm your SmartCook Assistant.\nHow can I inspire your next meal today?`
    }
  ]);

  const [input, setInput] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleProfileClick = async () => {
    if (!showProfile) {
      try {
        const response = await fetch("http://localhost:5000/api/profile/preferences");
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      }
    }
    setShowProfile(!showProfile);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { type: "user", content: input.trim() }]);
    setInput("");

    const response = await onSendMessage(input.trim(), messages.slice(-4));
    setMessages(prev => [...prev, {
      type: "assistant",
      content: response.response,
      suggestedRecipes: response.recipes || []
    }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col items-center p-6">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gray-200 p-2 rounded-full">
            <ChefHat className="w-5 h-5 text-gray-700" />
          </div>
          <h1 className="text-2xl font-light text-gray-800">SmartCook Assistant</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleProfileClick}>
            <Sparkles className="w-4 h-4 mr-1" /> Profile
          </Button>
          <Button variant="ghost">
            <Apple className="w-4 h-4 mr-1" /> Ingredients
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <ChatMessage message={msg} />
              {msg.suggestedRecipes && <SuggestedRecipes recipes={msg.suggestedRecipes} />}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-500 mb-2">💡 Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <span 
                  key={i}
                  onClick={() => setInput(q)}
                  className="cursor-pointer px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-3 border-t p-4 bg-gray-50">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 rounded-full bg-white border-gray-300"
          />
          <Button 
            type="submit"
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Profile Summary */}
      {showProfile && profileData && (
        <div className="w-full max-w-4xl mt-6">
          <ProfileSummary userPrefs={profileData} inventory={inventory} userName={userName} />
        </div>
      )}
    </div>
  );
}
