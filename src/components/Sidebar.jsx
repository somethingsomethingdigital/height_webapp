import './Sidebar.css';

export default function Sidebar({ activeView, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="https://raw.githubusercontent.com/somethingsomethingdigital/height-assistant/a5a260e9786f142e55400c8db7804678295eea69/height_logo.png" alt="Height" className="logo-img" />
        <span className="logo-text">Height AI</span>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${activeView === 'ai' ? 'active' : ''}`}
          onClick={() => onNavigate('ai')}
        >
          <span className="nav-icon">🤖</span>
          <span>AI Chat</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'form' ? 'active' : ''}`}
          onClick={() => onNavigate('form')}
        >
          <span className="nav-icon">📋</span>
          <span>Bid Writing Prompt</span>
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
