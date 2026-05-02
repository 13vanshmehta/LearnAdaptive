import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ExamMode = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions] = useState(10);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        const response = await apiService.getUserProgress();
        setUserProgress(response.data);
      } catch (err) {
        console.error('Failed to fetch user progress:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProgress();
  }, [user]);

  useEffect(() => {
    let timer;
    if (examStarted && !examFinished && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setExamFinished(true);
    }
    return () => clearInterval(timer);
  }, [examStarted, examFinished, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateGrade = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A-';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    return 'C';
  };

  const handleAnswerSubmit = () => {
    setScore(s => s + (Math.random() > 0.3 ? 1 : 0)); // Simulate 70% correct rate
    setAnsweredQuestions(a => a + 1);
    
    if (answeredQuestions + 1 >= totalQuestions) {
      setExamFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <p>Loading exam...</p>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h2>Timed Exam Mode ⏱️</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          Test your knowledge under pressure. You have 10 minutes to complete {totalQuestions} adaptive questions across your learned subjects.
        </p>
        {userProgress && (
          <div style={{ 
            background: '#f8fafc', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Your Topics:</h4>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {userProgress.topicProgress?.slice(0, 3).map(tp => (
                <li key={tp.topic} style={{ marginBottom: '0.25rem' }}>
                  • {tp.topic} (Level {tp.level})
                </li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={() => setExamStarted(true)} className="btn btn-primary">Start Exam Now</button>
      </div>
    );
  }

  if (examFinished) {
    const grade = calculateGrade(score, totalQuestions);
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h2>Exam Finished! 🎉</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: '#10b981' }}>{score}/{totalQuestions}</div>
            <p>Score</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)' }}>{grade}</div>
            <p>Grade</p>
          </div>
        </div>
        <div style={{ textAlign: 'left', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h4>Exam Summary:</h4>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li>Topics Covered: {userProgress?.topicProgress?.length || 0}</li>
            <li>Time Taken: {Math.floor((600 - timeLeft) / 60)} minutes</li>
            <li>Accuracy: {Math.round((score / totalQuestions) * 100)}%</li>
          </ul>
        </div>
        <button onClick={() => window.location.href = '/'} className="btn btn-primary">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Adaptive Assessment</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Question {answeredQuestions + 1} of {totalQuestions}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: timeLeft < 60 ? '#ef4444' : 'var(--text-main)' }}>
          <Clock size={24} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Question {answeredQuestions + 1}</h3>
        <p style={{ fontSize: '1.125rem', marginBottom: '2rem', lineHeight: 1.5 }}>
          Which data structure is most optimal for implementing a Depth-First Search (DFS) on a graph?
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <input type="radio" name="q1" value="queue" />
            <span>Queue</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <input type="radio" name="q1" value="stack" />
            <span>Stack</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <input type="radio" name="q1" value="priority_queue" />
            <span>Priority Queue</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <input type="radio" name="q1" value="graph_matrix" />
            <span>Graph Matrix</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          {answeredQuestions + 1 >= totalQuestions ? (
            <button onClick={() => setExamFinished(true)} className="btn btn-primary">Submit & Finish Exam</button>
          ) : (
            <button onClick={handleAnswerSubmit} className="btn btn-primary">Next Question</button>
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div style={{ flex: 1, height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--primary)', 
              width: `${(answeredQuestions / totalQuestions) * 100}%`,
              transition: 'width 0.3s'
            }}></div>
          </div>
          <span>{answeredQuestions}/{totalQuestions}</span>
        </div>
      </div>
    </div>
  );
};

export default ExamMode;

