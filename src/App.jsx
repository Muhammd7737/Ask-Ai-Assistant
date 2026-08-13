import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Ask me anything about your spending!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    if (input.trim() === '') return

    const userMessage = { sender: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:2030/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: input })
      })

      const data = await response.json()

      setMessages(prev => [...prev, { sender: 'bot', text: data.answer }])
    } catch (error) {
      console.error('Error talking to backend:', error)
      setMessages(prev => [...prev, { sender: 'bot', text: 'Something went wrong connecting to the server.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSend()
    }
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
        </div>

        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender}`}>
              <div className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row bot">
              <div className="message bot typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your spending..."
          />
          <button onClick={handleSend} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App