/**
 * @file        ChatMessage.jsx
 * @module      AI
 * @purpose     Renders individual chat messages for User and AI Assistant
 *              with distinct styling, icons, and timestamp.
 */

import React from "react";
import { FiUser, FiCpu } from "react-icons/fi";
import { MESSAGE_ROLES } from "../constants/aiConstants";

function ChatMessage({ message }) {
  const isUser = message.role === MESSAGE_ROLES.USER;
  const isSystem = message.role === MESSAGE_ROLES.SYSTEM;

  // Render markdown-like simple line breaks and bullet points cleanly
  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      // Bold rendering for **text**
      const formattedLine = line.split(/(\*\*.*?\*\*)/).map((segment, segIdx) => {
        if (segment.startsWith("**") && segment.endsWith("**")) {
          return <strong key={segIdx}>{segment.slice(2, -2)}</strong>;
        }
        return segment;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <div key={idx} className="d-flex align-items-start gap-1 ps-2 my-1">
            <span className="text-primary">•</span>
            <span>{formattedLine}</span>
          </div>
        );
      }
      return (
        <React.Fragment key={idx}>
          {formattedLine}
          {idx < text.split("\n").length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  if (isSystem) {
    return (
      <div className="text-center my-2">
        <span className="badge bg-warning bg-opacity-25 text-warning-emphasis border border-warning px-2 py-1 small">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`d-flex mb-3 gap-2 ${isUser ? "justify-content-end" : "justify-content-start"}`}>
      {/* Bot Icon */}
      {!isUser && (
        <div
          className="ai-avatar ai-avatar-bot rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          title="MedChem AI"
        >
          <FiCpu size={15} />
        </div>
      )}

      {/* Message Bubble */}
      <div className={`ai-message-bubble ${isUser ? "ai-bubble-user" : "ai-bubble-bot"}`}>
        <div className="ai-message-text">{renderFormattedText(message.text)}</div>
        <div className={`ai-message-time ${isUser ? "text-white-50" : "text-muted"}`}>
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </div>
      </div>

      {/* User Icon */}
      {isUser && (
        <div
          className="ai-avatar ai-avatar-user rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          title="You"
        >
          <FiUser size={15} />
        </div>
      )}
    </div>
  );
}

export default ChatMessage;
