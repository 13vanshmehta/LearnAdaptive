import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, MessageSquare, LayoutDashboard, Settings, BrainCircuit, Timer } from 'lucide-react'
import { apiService } from '../services/api'

const Sidebar = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(68);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await apiService.getDashboardData();
        const accuracy = res.data?.stats?.accuracy || 68;
        setProgress(accuracy);
      } catch (err) {
        console.error("Failed to fetch sidebar progress", err);
      }
    };
    fetchProgress();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Learning Hub', path: '/hub', icon: BookOpen },
    { name: 'Ask AI', path: '/ask', icon: MessageSquare },
    { name: 'Rapid MCQ', path: '/rapid-mcq', icon: Timer },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <BrainCircuit size={24} color="#8ab4ff" />
        <span>LearnAdaptive</span>
      </div>
      
      <div className="nav-menu">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              to={item.path} 
              key={item.name} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div style={{ marginTop: 'auto' }}>
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '24px', 
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Progress
            </p>
            <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 800 }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                transition: 'width 1s cubic-bezier(0.165, 0.84, 0.44, 1)',
                boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
              }} 
            />
          </div>
          <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.75rem', fontWeight: 600, fontStyle: 'italic' }}>
            Backend synced workflow
          </p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
