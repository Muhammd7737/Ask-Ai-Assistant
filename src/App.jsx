import { useState, useRef, useEffect } from "react";
import "./App.css";

const SUGGESTIONS = [
  "What's my top spending category?",
  "How much have I spent this month?",
  "What's my biggest expense?",
];

function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Ask me anything about your spending!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    if (text.trim() === "" || loading) return;

    const userMessage = { sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://pocketpal-yaj9.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: text }),
      });

      const data = await response.json();

      setMessages((prev) => [...prev, { sender: "bot", text: data.answer }]);
    } catch (error) {
      console.error("Error talking to backend:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong connecting to the server." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  }

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <div className="app-shell">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-icon">$</div>
          <div>
            <div className="chat-header-title">Spending Assistant</div>
            <div className="chat-header-subtitle">Ask about your PocketPal data</div>
          </div>
        </div>

        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender} fade-in`}>
              <div className={`message ${msg.sender}`}>{msg.text}</div>
            </div>
          ))}

          {loading && (
            <div className="message-row bot fade-in">
              <div className="message bot typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showSuggestions && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="input-area">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your spending..."
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;