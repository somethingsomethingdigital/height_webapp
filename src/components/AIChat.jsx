import { useState, useRef, useEffect } from 'react';
import './Chat.css';

const SYSTEM_PROMPT = 'You are a helpful, knowledgeable, and friendly AI assistant. Answer questions clearly and concisely. When files are provided, answer questions about their contents.';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_SIZE = 10 * 1024 * 1024;

function fileIcon(mimeType) {
  if (mimeType === 'application/pdf') return '📄';
  if (IMAGE_TYPES.has(mimeType)) return '🖼️';
  return '📎';
}

function readFileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (file.type === 'application/pdf' || IMAGE_TYPES.has(file.type)) {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => resolve(reader.result);
      reader.readAsText(file);
    }
    reader.onerror = reject;
  });
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

function WandButton({ text, onSend }) {
  const [active, setActive] = useState(false);
  const handle = () => {
    if (active) return;
    setActive(true);
    onSend(`Please rewrite the following response in the style of Shakespearean English (ye olde English):\n\n${text}`);
    setTimeout(() => setActive(false), 1800);
  };
  return (
    <button className={`msg-wand-btn${active ? ' active' : ''}`} onClick={handle} title="Rewrite in Shakespearean English">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
        <path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/>
        <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
      </svg>
    </button>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button className="msg-copy-btn" onClick={copy} title="Copy to clipboard">
      {copied
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

function Message({ msg, onWand }) {
  if (msg.role === 'assistant') {
    return (
      <div className="message assistant">
        <div className="assistant-content">
          <div className="message-bubble">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          </div>
          {msg.content && (
            <div className="msg-actions">
              <CopyButton text={msg.content} />
              <WandButton text={msg.content} onSend={onWand} />
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="message user">
      <div className="message-bubble">
        {msg.files?.length > 0 && (
          <div className="file-chips">
            {msg.files.map((f, i) => (
              <div key={i} className="file-chip">
                <span>{fileIcon(f.mimeType)}</span>
                <span className="file-chip-name">{f.name}</span>
              </div>
            ))}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
      </div>
    </div>
  );
}

export default function AIChat({ token, onUnauthorized }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [fileError, setFileError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;

    const oversized = files.find(f => f.size > MAX_SIZE);
    if (oversized) {
      setFileError(`${oversized.name} is too large (max 10MB per file)`);
      return;
    }
    setFileError('');

    try {
      const loaded = await Promise.all(
        files.map(async f => ({
          name: f.name,
          mimeType: f.type || 'text/plain',
          data: await readFileData(f),
        }))
      );
      setAttachments(prev => [...prev, ...loaded]);
    } catch {
      setFileError('Could not read one or more files');
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendProgrammatic = async (text) => {
    if (loading) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, system: SYSTEM_PROMPT }),
      });
      if (res.status === 401) { onUnauthorized(); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
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
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !attachments.length) || loading) return;

    const files = attachments;
    const content = text || 'Please analyze the contents of these files.';
    const userMsg = {
      role: 'user',
      content,
      files: files.length ? files.map(f => ({ name: f.name, mimeType: f.mimeType })) : undefined,
    };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput('');
    setAttachments([]);
    setLoading(true);

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          system: SYSTEM_PROMPT,
          files: files.length ? files : undefined,
        }),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
    } catch {
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

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setAttachments([]);
    setFileError('');
    inputRef.current?.focus();
  };

  return (
    <div className="chat-container">
      {messages.length > 0 && (
        <div className="chat-topbar">
          <button className="reset-btn" onClick={clearChat}>New chat</button>
        </div>
      )}

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-heading">How can I help you today?</div>
            <p>Ask anything, or attach a file to get started.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} onWand={sendProgrammatic} />
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-bubble typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.pdf,image/*"
        />

        {(attachments.length > 0 || fileError) && (
          <div className="attachment-row">
            {attachments.map((f, i) => (
              <div key={i} className="attachment-preview">
                <span>{fileIcon(f.mimeType)}</span>
                <span className="attachment-name">{f.name}</span>
                <button className="remove-attachment" onClick={() => removeAttachment(i)}>×</button>
              </div>
            ))}
            {fileError && <span className="file-error">{fileError}</span>}
          </div>
        )}

        <div className="input-box">
          <button
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Attach files"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder=""
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={(!input.trim() && !attachments.length) || loading}
          >
            ↑
          </button>
        </div>
        <p className="input-hint">AI can make mistakes. Checking important information.</p>
      </div>
      <div className="fc-powered-footer">
        <span>Powered by <a href="https://www.somethingsomething.digital" target="_blank" rel="noopener">Something Something Digital</a></span>
      </div>
    </div>
  );
}
