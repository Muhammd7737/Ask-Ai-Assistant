import { useState, useRef, useEffect } from "react";
import "./App.css";

// Helper function to fetch with retries and timeout
async function fetchWithRetry(url, options, retries = 4, delayMs = 8000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok && response.status >= 500) {
      throw new Error(`Server starting up (Status: ${response.status})`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Server sleeping or booting up. Retrying in ${delayMs / 1000} seconds... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs);
    }
    throw error;
  }
}

const SUGGESTIONS = [
  "What's my top spending category?",
  "How much have I spent this month?",
  "What's my biggest expense?",
];

function App() {
  const [loginLoading, setLoginloading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("pocketpal_token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    setLoginError("Connecting... this can take up to a minute if the server was asleep.");

    try {
      const response = await fetchWithRetry("https://pocketpal-yaj9.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || "Login failed");
        setLoginLoading(false);
        return;
      }

      localStorage.setItem("pocketpal_token", data.token);
      setToken(data.token);
    } catch (error) {
      setLoginError("Could not reach the server. Please try again in a moment.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("pocketpal_token");
    setToken(null);
    setMessages([{ sender: "bot", text: "Ask me anything about your spending!" }]);
  }

  async function sendMessage(text) {
    if (text.trim() === "" || loading) return;

    const userMessage = { sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetchWithRetry("https://pocketpal-yaj9.onrender.com/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: text }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        setMessages((prev) => [...prev, { sender: "bot", text: "Your session expired. Please log in again." }]);
        return;
      }

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

  if (!token) {
    return (
      <div className="app-shell">
        <div className="chat-container login-container">
          <div className="chat-header">
            <div className="chat-header-icon">$</div>
            <div>
              <div className="chat-header-title">Spending Assistant</div>
              <div className="chat-header-subtitle">Log in with your PocketPal account</div>
            </div>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit">Log In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-icon">$</div>
          <div>
            <div className="chat-header-title">Spending Assistant</div>
            <div className="chat-header-subtitle">Ask about your PocketPal data</div>
          </div>
          <button className="logout-button" onClick={handleLogout}>Log out</button>
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