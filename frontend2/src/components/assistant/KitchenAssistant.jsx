import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ChefHat, Sparkles, Apple, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatMessage from "./ChatMessage";
import SuggestedRecipes from "./SuggestedRecipes";
import ProfileSummary from "./ProfileSummary";

const EXAMPLE_QUESTIONS = [
  "What can I cook with the ingredients I have?",
  "Suggest a quick healthy dinner",
  "How do I make a sauce with these ingredients?",
  "What's expiring soon and how can I use it?"
];

export default function KitchenAssistant({ onSendMessage, inventory, userPrefs, userName }) {
  const [messages, setMessages] = React.useState([
    {
      type: "assistant",
      content: `Hi${userName ? ` ${userName}` : ''}! I'm your AI kitchen assistant. I can help you find recipes, answer cooking questions, and make the most of your ingredients. What would you like to know today?`
    }
  ]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setIsTyping(true);

    const recentChatHistory = messages.slice(-4);

    try {
      const response = await onSendMessage(userMessage, recentChatHistory);
      setMessages(prev => [...prev, {
        type: "assistant",
        content: response.response,
        suggestedRecipes: response.suggested_recipes
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: "error",
        content: "I'm sorry, I encountered an error. Please try again."
      }]);
    }

    setIsTyping(false);
  };

  const handleExampleClick = (question) => {
    setInput(question);
  };

  const getExpiringIngredients = () => {
    return inventory
      .filter(ing => ing.expiry_date)
      .filter(ing => {
        const daysUntilExpiry = Math.ceil((new Date(ing.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3;
      })
      .map(ing => ing.name);
  };

  const suggestFromExpiring = () => {
    const expiring = getExpiringIngredients();
    if (expiring.length > 0) {
      setInput(`What can I make with ${expiring.join(', ')} that are expiring soon?`);
    } else {
      setInput("What can I cook with my current ingredients?");
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
      <Card className="h-full flex flex-col bg-white">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold">Kitchen Assistant</h2>
              <p className="text-sm text-gray-500">Ask me anything about cooking!</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowProfile(!showProfile)}
              className="text-sm"
            >
              {showProfile ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Hide Profile
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  My Profile
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={suggestFromExpiring}
              className="text-sm hidden md:flex"
            >
              <Apple className="w-4 h-4 mr-1" />
              {getExpiringIngredients().length > 0 ? "Use Expiring Items" : "Cook with Ingredients"}
            </Button>
          </div>
        </div>

        {showProfile && (
          <ProfileSummary 
            userPrefs={userPrefs} 
            inventory={inventory}
            userName={userName}
          />
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ChatMessage message={message} />
                  {message.suggestedRecipes && (
                    <SuggestedRecipes recipes={message.suggestedRecipes} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-gray-500"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div className="flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                </div>
              </motion.div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-b bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(question)}
                  className="text-sm"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about recipes, cooking tips, or ingredients..."
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
