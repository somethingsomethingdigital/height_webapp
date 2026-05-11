import './Sidebar.css';

export default function Sidebar({ activeView, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">◈</span>
        <span className="logo-text">Height AI</span>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${activeView === 'form' ? 'active' : ''}`}
          onClick={() => onNavigate('form')}
        >
          <span className="nav-icon">📋</span>
          <span>Bid Writing Prompt</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'ai' ? 'active' : ''}`}
          onClick={() => onNavigate('ai')}
        >
          <span className="nav-icon">🤖</span>
          <span>AI Chat</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span className="nav-icon">↩</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
