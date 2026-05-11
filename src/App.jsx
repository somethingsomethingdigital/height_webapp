import { useState } from 'react';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import FormChat from './components/FormChat.jsx';
import AIChat from './components/AIChat.jsx';
import './App.css';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [activeView, setActiveView] = useState('form');

  const handleLogin = (t) => setToken(t);

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    localStorage.removeItem('auth_token');
    setToken(null);
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div className="app">
      <Sidebar activeView={activeView} onNavigate={setActiveView} onLogout={handleLogout} />
      <main className="main-content">
        {activeView === 'form' ? <FormChat token={token} onUnauthorized={handleLogout} /> : <AIChat token={token} onUnauthorized={handleLogout} />}
      </main>
    </div>
  );
}
