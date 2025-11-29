"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Loader, RotateCcw } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (token) {
      loadSuggestedQuestions();
      loadChatContext();
    }
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSuggestedQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/suggested-questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuggestedQuestions(data.suggested_questions || []);
    } catch (error) {
      console.log("Suggestion error:", error);
    }
  };

  const loadChatContext = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/context?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.messages?.length) {
        const formatted = data.messages.map((m) => ({
          type: m.role === "user" ? "user" : "bot",
          content: m.content,
        }));
        setMessages(formatted);
      }
    } catch (e) {
      console.log("Chat context error:", e);
    }
  };

  const sendMessage = async (msg = input) => {
    if (!msg.trim() || !token) return;

    setLoading(true);

    setMessages((prev) => [...prev, { type: "user", content: msg.trim() }]);
    setInput("");

    try {
      const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { type: "bot", content: data.bot_response }]);
        setSuggestedQuestions([]);
      } else {
        setMessages((prev) => [...prev, { type: "bot", content: "Something went wrong." }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Connection error. Check backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/chat/context`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages([]);
      setSuggestedQuestions([]);
      loadSuggestedQuestions();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Wellness Companion Chat</h1>
        <button
          onClick={clearChat}
          className="bg-white bg-opacity-20 px-3 py-2 rounded hover:bg-opacity-30 transition"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg font-semibold">Start chatting…</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.type === "user"
                    ? "bg-purple-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none shadow"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <Loader className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTED QUESTIONS */}
      {messages.length === 0 && suggestedQuestions.length > 0 && (
        <div className="bg-purple-50 border-t p-4">
          <p className="text-sm font-bold text-gray-600 mb-2">Suggested:</p>
          <div className="space-y-2">
            {suggestedQuestions.slice(0, 3).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="w-full text-left p-2 bg-white rounded border border-purple-200 hover:bg-purple-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT BAR */}
      <div className="border-t p-4 flex gap-2 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Write a message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:ring focus:ring-purple-300"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
