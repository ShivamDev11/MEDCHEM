/**
 * @file        AIChatbot.jsx
 * @module      AI
 * @purpose     Module 8: Floating conversational AI Assistant for MedChem.
 *              Connects real-time Firebase Firestore data with Google Gemini
 *              to answer natural-language questions about inventory, expiry, and sales.
 * @dependencies react, react-icons, geminiService, aiConstants, ChatMessage
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  FiMessageSquare, 
  FiX, 
  FiSend, 
  FiTrash2, 
  FiCpu,
  FiZap 
} from "react-icons/fi";
import ChatMessage from "./ChatMessage";
import { askMedChemAssistant } from "../services/geminiService";
import { MESSAGE_ROLES, AI_MESSAGES, SUGGESTED_PROMPTS } from "../constants/aiConstants";
import "../ai.css";

function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "greeting",
      role: MESSAGE_ROLES.ASSISTANT,
      text: AI_MESSAGES.GREETING,
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input field when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Handle sending a message
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: MESSAGE_ROLES.USER,
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponse = await askMedChemAssistant(query, messages);

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: MESSAGE_ROLES.ASSISTANT,
        text: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error communicating with AI Assistant:", error);
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: MESSAGE_ROLES.ASSISTANT,
        text: AI_MESSAGES.ERROR_GENERIC,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enter key submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation history
  const handleClearChat = () => {
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: MESSAGE_ROLES.ASSISTANT,
        text: AI_MESSAGES.GREETING,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      {/* ── Floating Launcher Button ───────────────────────────────────────── */}
      {!isOpen && (
        <button
          type="button"
          className="ai-floating-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          title="MedChem AI Assistant"
        >
          <span className="ai-launcher-pulse" aria-hidden="true" />
          <FiCpu size={16} />
          <span className="fw-semibold" style={{ fontSize: "0.9rem" }}>AI Assistant</span>
        </button>
      )}

      {/* ── Chat Window Panel ────────────────────────────────────────────── */}
      {isOpen && (
        <div className="ai-chat-window" role="dialog" aria-label="MedChem AI Assistant Chat Window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="d-flex align-items-center gap-2">
              <div className="p-1 rounded-circle bg-primary bg-opacity-25 text-info d-flex align-items-center justify-content-center">
                <FiCpu size={14} />
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-white" style={{ fontSize: "0.92rem", letterSpacing: "0.3px" }}>
                  MedChem AI
                </h6>
                <span className="ai-header-badge">
                  <span className="ai-launcher-pulse" style={{ width: 5, height: 5 }} /> Live Firestore Data
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="ai-header-btn"
                onClick={handleClearChat}
                title="Clear conversation"
                aria-label="Clear chat"
              >
                <FiTrash2 size={14} />
              </button>
              <button
                type="button"
                className="ai-header-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="ai-chat-body">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Loading / Typing Indicator */}
            {isLoading && (
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="ai-avatar ai-avatar-bot rounded-circle d-flex align-items-center justify-content-center">
                  <FiCpu size={13} />
                </div>
                <div className="ai-typing-indicator">
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
                <span className="text-muted" style={{ fontSize: "0.72rem" }}>Querying database...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="ai-suggestions-container">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-chip"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input & Send Form */}
          <div className="ai-chat-footer">
            <div className="ai-input-group">
              <input
                ref={inputRef}
                type="text"
                className="ai-input-field"
                placeholder="Ask about medicines, stock, expiry, sales..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                type="button"
                className="ai-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                title="Send message"
                aria-label="Send message"
              >
                <FiSend size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChatbot;
