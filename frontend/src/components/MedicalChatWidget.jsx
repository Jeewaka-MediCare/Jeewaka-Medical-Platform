// MedicalChatWidget.jsx - Simplified Medical Assistant Chat
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Maximize2 } from "lucide-react";

export default function MedicalChatWidget({ 
  user, 
  apiBaseUrl = "/api/agent"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Initialize chat session
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token || ""}`,
        },
      });

      if (!response.ok) throw new Error("Failed to create session");

      const data = await response.json();
      setSessionId(data.id);
      
      // Add greeting message
      if (data.greeting) {
        setMessages([
          {
            role: "assistant",
            content: data.greeting,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err) {
      console.error("Session initialization error:", err);
      setError("Failed to start chat. Please try again.");
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm your Jeewaka Medical Assistant. I can help you with medical questions and guide you through using the platform. What would you like to know?",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Open chat
  const openChat = () => {
    setIsOpen(true);
    if (!sessionId && messages.length === 0) {
      initializeSession();
    }
  };

  // Close chat
  const closeChat = async () => {
    if (sessionId) {
      try {
        await fetch(`${apiBaseUrl}/session/${sessionId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${user?.token || ""}`,
          },
        });
      } catch (err) {
        console.error("Failed to close session:", err);
      }
    }
    setIsOpen(false);
    setSessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // If no session, use single-turn chat
      const endpoint = sessionId 
        ? `${apiBaseUrl}/session/${sessionId}/message`
        : `${apiBaseUrl}/chat`;

      const body = sessionId
        ? { message: userMessage.content }
        : { message: userMessage.content };

      const headers = {
        "Content-Type": "application/json",
      };

      if (sessionId && user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      
      const assistantMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Send message error:", err);
      setError("Failed to send message. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="Open medical assistant chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? "bottom-6 right-6 w-80"
          : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh]"
      }`}
    >
      <div className="flex h-full flex-col rounded-2xl border border-emerald-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Jeewaka Medical Assistant</h3>
              <p className="text-xs text-emerald-100">
                Online • Ready to help
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="rounded-lg p-1.5 hover:bg-white/10 transition"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={closeChat}
              className="rounded-lg p-1.5 hover:bg-white/10 transition"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white"
                        : msg.isError
                        ? "bg-red-50 text-red-900 border border-red-200"
                        : "bg-white text-slate-800 border border-slate-200 shadow-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <span className="mt-1 block text-xs opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-2.5 border border-slate-200">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span className="text-sm text-slate-600">Typing...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 border border-red-200">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 p-4 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me about health or how to use Jeewaka..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
              <p className="mt-1 text-xs text-slate-400 text-center">
                I can help with medical questions and platform navigation
              </p>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="p-4 text-center">
            <p className="text-sm text-slate-600">Chat minimized</p>
          </div>
        )}
      </div>
    </div>
  );
}