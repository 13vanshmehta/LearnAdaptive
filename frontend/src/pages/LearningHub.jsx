import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Code, Server, Database, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Icon mapping
const iconMap = {
  Code: Code,
  Server: Server,
  Database: Database,
  Network: Network,
};

const LearningHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await apiService.getTopics();
        setTopics(response.data.topics);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch topics:', err);
        setError('Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [user]);

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading topics...</p>
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

  return (
    <div className="hub-page fade-in">
      <header className="page-hero">
        <span className="eyebrow">Curated Courses</span>
        <h1>Master Your Skills</h1>
        <p>Explore our library of AI-driven courses designed to take you from beginner to expert in record time.</p>
      </header>

      <div style={{ marginBottom: '2rem', maxWidth: '400px', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Search topics..." 
          className="input-field" 
          style={{ paddingLeft: '2.5rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Core Modules</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredTopics.map((topic) => {
          const Icon = iconMap[topic.icon] || Code;
          return (
            <div 
              key={topic.id} 
              className="card" 
              style={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
              }} 
              onClick={() => navigate(`/practice?topic=${topic.id}&locked=true&level=${topic.userProgress?.level || 1}`)}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: 'auto' }}>
                <div style={{ 
                  background: `var(--accent-${topic.color}, #e0e7ff)`, 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  color: `var(--accent-${topic.color}-text, #4f46e5)`,
                  flexShrink: 0,
                }}>
                  <Icon size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, marginBottom: '0.25rem' }}>
                    {topic.name}
                  </h4>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {topic.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                paddingTop: '0.875rem',
                borderTop: '1px solid var(--border-color)',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span className={`badge badge-${topic.color}`} style={{ whiteSpace: 'nowrap' }}>
                    {topic.status}
                  </span>
                </div>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  Start Practice <ArrowRight size={13} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <p>No topics found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
