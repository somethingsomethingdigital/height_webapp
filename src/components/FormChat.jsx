import { useState, useRef, useEffect } from 'react';
import './Chat.css';

const SYSTEM_PROMPT = `You are a friendly form assistant. Your job is to collect three pieces of information from the user: first name, last name, and email address.

Guide the conversation naturally:
1. Start by greeting the user and asking for their first name.
2. Once you have their first name, ask for their last name.
3. Once you have their last name, ask for their email address.
4. Once you have all three, present a summary and confirm the details look correct.
5. If the user confirms, thank them and let them know the form has been submitted.

Keep responses short and friendly. If the user provides multiple pieces of info at once, acknowledge them all and ask for whatever is still missing.`;

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi there! I'll help you fill out a quick form. To get started, could you tell me your **first name**?",
};

function Message({ msg }) {
  return (
    <div className={`message ${msg.role}`}>
      <div className="message-bubble" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
    </div>
  );
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function FormChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, system: SYSTEM_PROMPT }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const assistantMsg = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          } catch {}
        }
      }

      if (assistantText.toLowerCase().includes('submitted') || assistantText.toLowerCase().includes('thank you')) {
        setSubmitted(true);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([INITIAL_MESSAGE]);
    setSubmitted(false);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar form-avatar">📋</div>
          <div>
            <div className="chat-title">Form Assistant</div>
            <div className="chat-subtitle">I'll collect your details</div>
          </div>
        </div>
        {submitted && (
          <button className="reset-btn" onClick={reset}>Start Over</button>
        )}
      </header>

      <div className="messages">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={submitted ? 'Form submitted!' : 'Type your response…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={submitted || loading}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || loading || submitted}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
