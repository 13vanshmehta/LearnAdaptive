import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, BarChart3, BookOpen, Rocket, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardRes = await apiService.getDashboardData();
        setDashboardData(dashboardRes.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e11d48' }}>
        <p>{error}</p>
      </div>
    );
  }

  const branding = dashboardData?.branding || {};
  const summary = dashboardData?.summary || {};
  const stats = dashboardData?.stats || {};
  const activity = summary.activity || {};
  const homework = summary.homework || {};
  const level = summary.level || {};
  const insightCards = dashboardData?.insights || [];
  const tasks = dashboardData?.tasks || [];
  const courses = dashboardData?.courses || [];

  return (
    <div className="dashboard-shell">

      <div className="dashboard-grid">
        <section className="dashboard-main">
          <div className="hero-card panel panel-hero dashboard-hero">
            <div className="dashboard-hero-content">
              <span className="eyebrow" style={{ marginBottom: '1rem' }}>{dashboardData?.hero?.greeting || `Hello, ${dashboardData?.user?.full_name || 'Student'}`}</span>
              <h1 className="dashboard-hero-title">Your learning workflow is live.</h1>
              <p className="dashboard-hero-subtitle">{dashboardData?.hero?.subtitle || 'Track progress, launch rapid challenges, and focus on the exact topics that need work.'}</p>
              
              <div className="hero-micro-stats" style={{ marginTop: '0' }}>
                <span style={{ padding: '0.5rem 1rem', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>{stats.streak || 0} day streak</span>
                <span style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>{stats.accuracy || 0}% accuracy</span>
                <span style={{ padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>Last active today</span>
              </div>
            </div>
            
            <div className="hero-actions" style={{ gap: '0.75rem' }}>
              <button className="cta-button" onClick={() => navigate('/rapid-mcq')} style={{ padding: '1.2rem 2.5rem' }}>
                <Rocket size={20} />
                Launch 100s Challenge
              </button>
              <button className="mini-button" onClick={() => navigate('/hub')} style={{ padding: '1rem 2rem', background: 'white' }}>
                <BookOpen size={18} />
                Explore Hub
              </button>
            </div>
          </div>

          <div className="metric-row">
            <div className="metric-card panel metric-card-inner">
              <div className="metric-head metric-card-head">
                <span>{activity.label || 'Daily Streak'}</span>
                <Sparkles size={16} color="#d97706" />
              </div>
              <div className="metric-value metric-card-value">{activity.streak || 0}</div>
              <div className="metric-subtitle metric-card-subtitle">{activity.daysText || 'days in a row'}</div>
              <div className="timeline-row">
                {(activity.timeline || []).map((day) => (
                  <span key={day.day} className={`timeline-chip ${day.active ? 'active' : ''}`} style={{ flex: 1, minWidth: 'auto' }}>
                    {day.day.charAt(0)}
                  </span>
                ))}
              </div>
            </div>

            <div className="metric-card panel metric-card-inner">
              <div className="metric-head metric-card-head">
                <span>{homework.label || 'Course Load'}</span>
                <BookOpen size={16} color="#2563eb" />
              </div>
              <div className="metric-value metric-card-value">{homework.completed || 0}/{homework.total || 0}</div>
              <div className="metric-subtitle metric-card-subtitle">{homework.note || 'Ready for your next test'}</div>
              <div className="progress-track" style={{ height: '10px', background: 'rgba(0,0,0,0.05)' }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, ((homework.completed || 0) / (homework.total || 1)) * 100)}%` }} />
              </div>
            </div>

            <div className="metric-card panel metric-card-inner">
              <div className="metric-head metric-card-head">
                <span>{level.label || 'Expertise Level'}</span>
                <BarChart3 size={16} color="#db2777" />
              </div>
              <div className="metric-value metric-card-value" style={{ fontSize: '2rem' }}>{level.value || 'Beginner'}</div>
              <div className="metric-subtitle metric-card-subtitle" style={{ marginBottom: '1.2rem' }}>Tested on {level.testedOn || 'today'}</div>
              <button className="mini-button" style={{ width: '100%', padding: '0.75rem' }} onClick={() => navigate('/rapid-mcq')}>Recalibrate Level</button>
            </div>
          </div>

          <div className="insight-panel panel panel-highlight insight-panel-container">
            <div className="panel-heading insight-panel-heading">
              <div className="insight-icon-wrapper">
                <Sparkles size={24} />
              </div>
              <div className="insight-text-wrapper">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>Adaptive AI Insight</h3>
                <p style={{ fontSize: '0.95rem', color: '#065f46', opacity: 0.8, fontWeight: 500 }}>{dashboardData?.weaknessDetection?.reason || 'Based on your last practice sessions, you showed difficulty in certain areas.'}</p>
              </div>
              <button className="mini-button" style={{ background: '#059669', color: 'white', border: 'none' }} onClick={() => navigate(`/practice?topic=${dashboardData?.weaknessDetection?.weakTopic}`)}>
                Practice Now
              </button>
            </div>
          </div>

          <div className="panel courses-panel courses-panel-container">
            <div className="section-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Your Courses</h3>
                <p style={{ fontSize: '0.8rem' }}>Current progress across all modules.</p>
              </div>
            </div>
            <div className="course-list">
              {courses.slice(0, 3).map((course) => (
                <div className="course-row course-row-inner" key={course.id}>
                  <div className="course-name">
                    <div className="course-dot" />
                    <strong>{course.name}</strong>
                  </div>
                  <div className="course-progress" style={{ minWidth: '120px' }}>
                    <div className="course-progress-track" style={{ width: '100%', margin: '0 0 4px 0' }}>
                      <div className="course-progress-fill" style={{ width: `${course.percent}%` }} />
                    </div>
                    <small>{course.status}</small>
                  </div>
                  <div className="course-score" style={{ fontSize: '0.9rem' }}>{course.percent}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="dashboard-side">
          <div className="panel side-panel">
            <div className="section-header compact">
              <div>
                <h3>Homework tasks</h3>
                <p>Generated by backend logic.</p>
              </div>
              <button className="icon-button" onClick={() => navigate('/rapid-mcq')} title="Open Rapid MCQ">
                <Target size={18} />
              </button>
            </div>

            <div className="task-list">
              {tasks.map((task) => (
                <article className={`task-card task-tone-${task.category.toLowerCase().replace(/\s+/g, '-')}`} key={task.title}>
                  <div className="task-head">
                    <span className="task-category">{task.category}</span>
                    <span className="task-due">Due: {task.due}</span>
                  </div>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="task-footer">
                    <span className={`status-pill ${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span>
                    <button className="mini-button" onClick={() => navigate(task.path)}>
                      {task.action}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
