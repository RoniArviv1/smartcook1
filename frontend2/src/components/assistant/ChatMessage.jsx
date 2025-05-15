import React from 'react';
import { ChefHat, User } from "lucide-react";
import cn from 'classnames';  // הייבוא של classnames

export default function ChatMessage({ message }) {
  return (
    <div
      className={cn(
        "flex gap-3",
        message.type === "user" && "justify-end"
      )}
    >
      {message.type === "assistant" && (
        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-4 h-4 text-orange-600" />
        </div>
      )}
      
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          message.type === "assistant" && "bg-gray-100",
          message.type === "user" && "bg-orange-500 text-white",
          message.type === "error" && "bg-red-100 text-red-700"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {message.type === "user" && (
        <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}