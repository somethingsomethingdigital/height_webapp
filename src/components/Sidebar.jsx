import './Sidebar.css';

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">◈</span>
        <span className="logo-text">ChatApp</span>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${activeView === 'form' ? 'active' : ''}`}
          onClick={() => onNavigate('form')}
        >
          <span className="nav-icon">📋</span>
          <span>Form</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'ai' ? 'active' : ''}`}
          onClick={() => onNavigate('ai')}
        >
          <span className="nav-icon">🤖</span>
          <span>AI Chat</span>
        </button>
      </nav>
    </aside>
  );
}
