import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Ask me anything about your spending!" },
  ]);
  const [input, setInput] = useState("");

  async function handleSend() {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const response = await fetch("https://pocketpal-yaj9.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: data.answer },
      ]);
    } catch (error) {
      console.error("Error talking to backend:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "bot",
          text: "Something went wrong connecting to the server.",
        },
      ]);
    }
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your spending..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default App;
