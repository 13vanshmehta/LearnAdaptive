import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { LogOut, Trash2, Moon, Sun, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const expectedQuote = `delete my account, ${user?.full_name || 'Student'}`;

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== expectedQuote) return;
    
    setLoading(true);
    try {
      await apiService.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to delete account", err);
      alert("Error deleting account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page fade-in">
      <header className="page-hero">
        <span className="eyebrow">User Preferences</span>
        <h1>Account Settings</h1>
        <p>Manage your profile, theme preferences, and account security here.</p>
      </header>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="panel settings-panel">
          <h3 className="settings-section-title">
            Personal Information
          </h3>
          <div className="profile-section">
            <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{user?.full_name || 'Student Name'}</p>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{user?.email || 'email@example.com'}</p>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="panel settings-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Preferences</h3>
          <div className="settings-row">
            <div>
              <strong style={{ display: 'block' }}>Appearance</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Switch between light and dark themes</span>
            </div>
            <button className="mini-button" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>

        {/* Actions Card */}
        <div className="panel settings-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Account Actions</h3>
          <div className="danger-zone">
            <div className="settings-row">
              <div>
                <strong style={{ display: 'block' }}>Logout</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sign out of your session on this device</span>
              </div>
              <button className="mini-button" onClick={logout} style={{ color: '#ef4444' }}>
                <LogOut size={18} /> Logout
              </button>
            </div>
            
            <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
            
            <div className="settings-row">
              <div>
                <strong style={{ display: 'block', color: '#ef4444' }}>Danger Zone</strong>
                <span style={{ fontSize: '0.9rem', color: '#ef4444', opacity: 0.8 }}>Permanently delete your account and all data</span>
              </div>
              <button className="mini-button" onClick={() => setShowDeleteModal(true)} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444' }}>
                <Trash2 size={18} /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="panel modal-content">
            <div style={{ color: '#ef4444', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <AlertTriangle size={48} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Wait! Are you sure?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Deleting your account is permanent and cannot be undone. All your progress, levels, and chat history will be lost forever.
            </p>
            
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                Please type <span style={{ color: '#ef4444' }}>{expectedQuote}</span> to confirm:
              </label>
              <input 
                className="input-field"
                placeholder={expectedQuote}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="mini-button" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button 
                className="cta-button" 
                style={{ flex: 1, background: '#ef4444', border: 'none', opacity: deleteConfirmText === expectedQuote ? 1 : 0.5 }} 
                disabled={deleteConfirmText !== expectedQuote || loading}
                onClick={handleDeleteAccount}
              >
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
