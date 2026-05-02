import React, { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Bell, User, LogOut, BrainCircuit, Menu, X, Home, BookOpen, MessageSquare, ListChecks, Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { label: 'Home', path: '/', icon: <Home size={20} /> },
    { label: 'Learning Hub', path: '/hub', icon: <BookOpen size={20} /> },
    { label: 'Ask AI', path: '/ask', icon: <MessageSquare size={20} /> },
    { label: 'Rapid MCQ', path: '/rapid-mcq', icon: <ListChecks size={20} /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const pageTitle = tabs.find((item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))?.label || 'Home';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="app-container">
      <div className="app-window">
        <div className="main-content" style={{ flex: 1, width: '100%' }}>
          <header className="top-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0, paddingLeft: 0, color: 'var(--text-main)' }}>
                <BrainCircuit size={24} color="var(--primary)" />
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>LearnAdaptive</span>
              </div>
              <div className="header-divider"></div>
              <div className="page-title">{pageTitle}</div>
            </div>

            <nav className="top-tabs" aria-label="Primary">
              {tabs.map((tab) => {
                const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
                return (
                  <Link key={tab.path} to={tab.path} className={`top-tab ${isActive ? 'active' : ''}`}>
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            <div className="user-profile">
              <button className="icon-ghost-button" title="Notifications">
                <Bell size={20} />
              </button>

              <div className="profile-meta">
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>
                    {user?.full_name || 'Student'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    {user?.email}
                  </p>
                </div>
                <div className="avatar">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={20} />}
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="icon-ghost-button danger"
                  style={{ marginLeft: '0.5rem' }}
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle Menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

          {/* Mobile Navigation Overlay */}
          <div className={`mobile-nav-overlay ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-nav-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}>
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{user?.full_name || 'Student'}</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="mobile-nav-links">
                {tabs.map((tab) => {
                  const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
                  return (
                    <Link 
                      key={tab.path} 
                      to={tab.path} 
                      className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mobile-nav-footer">
                <button 
                  onClick={logout}
                  className="mobile-nav-link"
                  style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          <main className="content-area fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
