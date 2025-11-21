import React, { useState } from "react";
import { Chatbot } from "supersimpledev";
import "../Components/ChatInput.css";

function ChatInput({ chatMessages, setChatMessages }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function saveInputText(event) {
    setInputText(event.target.value);
  }

  async function sendMessage() {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      message: inputText,
      sender: "user",
      id: crypto.randomUUID(),
    };

    const newMessagesAfterUser = [...chatMessages, userMessage];

    setChatMessages(newMessagesAfterUser);
    setInputText("");
    setIsLoading(true);

    const response = await Chatbot.getResponseAsync(userMessage.message);
    try {
      setChatMessages([
        ...newMessagesAfterUser,
        { message: response, sender: "robot", id: crypto.randomUUID() },
      ]);
    } catch (error) {
      console.error("Chatbot failed to response:", error);
    } finally {
       setIsLoading(false);
    }
  }

  async function useEnter(event) {
    if (event.key === "Enter") {
      await sendMessage();
    } else if (event.key === "Escape") {
      setInputText("");
    }
  }

  return (
    <div className="chat-input-container">
      <input
        type="text"
        placeholder={isLoading ? "Waiting for response..." : "Send a message to chatbot"}
        size="30"
        onChange={saveInputText}
        value={inputText}
        className="chat-input"
        onKeyDown={useEnter}
        disabled={isLoading}
      />
      <button onClick={sendMessage} 
        className="send-button"
        disabled={isLoading}
        >
        {isLoading ? "Loading..." : "send"}
        
      </button>
    </div>
  );
}
export default ChatInput;
