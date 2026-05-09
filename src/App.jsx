import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import FormChat from './components/FormChat.jsx';
import AIChat from './components/AIChat.jsx';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('form');

  return (
    <div className="app">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main-content">
        {activeView === 'form' ? <FormChat /> : <AIChat />}
      </main>
    </div>
  );
}
