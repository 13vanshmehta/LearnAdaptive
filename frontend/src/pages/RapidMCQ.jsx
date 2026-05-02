import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, Sparkles, Timer, Trophy, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import Typewriter from '../components/Typewriter';


const LEVELS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Intermediate' },
  { value: 3, label: 'Advanced' },
];

const RapidMCQ = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState(searchParams.get('topic') || 'dsa');
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(10);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await apiService.getTopics();
        setTopics(response.data.topics || []);
        if (!searchParams.get('topic') && response.data.topics?.[0]?.id) {
          setTopic(response.data.topics[0].id);
        }
      } catch (error) {
        console.error('Failed to load topics for rapid mcq', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [searchParams]);

  useEffect(() => {
    if (!session || result || submitting) {
      return undefined;
    }

    if (timeLeft <= 0) {
      if (currentIndex >= questions.length - 1) {
        void submitRound();
      } else {
        setCurrentIndex((curr) => curr + 1);
        setTimeLeft(10);
      }
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => current - 1);
      setTotalTimeSpent((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session, timeLeft, result, submitting, currentIndex, questions.length]);

  const selectedQuestion = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const answeredPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  const topicName = useMemo(() => {
    return topics.find((entry) => entry.id === topic)?.name || topic.replace('_', ' ');
  }, [topics, topic]);

  const startRound = async () => {
    try {
      setStarting(true);
      setResult(null);
      setSelectedAnswers({});
      setCurrentIndex(0);
      const response = await apiService.createRapidMcqSession(topic, level);
      setSession(response.data);
      setQuestions(response.data.questions || []);
      setTimeLeft(10);
      setTotalTimeSpent(0);
    } catch (error) {
      console.error('Failed to start rapid mcq round', error);
    } finally {
      setStarting(false);
    }
  };

  const selectAnswer = (questionId, optionIndex) => {
    setSelectedAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  };

  const submitRound = async () => {
    if (!session || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = questions.map((question) => ({
        question_id: question.id,
        selected_index: selectedAnswers[question.id] ?? null,
      }));

      const response = await apiService.submitRapidMcqSession(session.session_id, payload, totalTimeSpent);
      setResult(response.data);
    } catch (error) {
      console.error('Failed to submit rapid mcq round', error);
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentIndex >= questions.length - 1) {
      void submitRound();
      return;
    }

    setCurrentIndex((value) => Math.min(value + 1, questions.length - 1));
    setTimeLeft(10);
  };

  const restartRound = () => {
    setSession(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setTimeLeft(10);
    setTotalTimeSpent(0);
    setResult(null);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 className="spinner" size={20} />
        <p>Loading Rapid MCQ challenge...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rapid-page">
        <header className="page-hero">
          <span className="eyebrow">Skills Challenge</span>
          <h1>Rapid MCQ: Speed & Precision</h1>
          <p>Answer 10 fast-paced questions. Get instant AI-verified analysis and strengthen your weak areas.</p>
        </header>

        <div className="rapid-grid">
          <section className="panel rapid-config-panel">
            <div className="panel-heading compact-heading">
              <Sparkles size={18} />
              <div>
                <h3>Configure the round</h3>
                <p>All questions are generated by the backend AI layer.</p>
              </div>
            </div>

            <div className="control-grid">
              <label className="field-group">
                <span>Topic</span>
                <select className="input-field" value={topic} onChange={(event) => setTopic(event.target.value)}>
                  {topics.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.name}</option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                <span>Level</span>
                <select className="input-field" value={level} onChange={(event) => setLevel(Number(event.target.value))}>
                  {LEVELS.map((entry) => (
                    <option key={entry.value} value={entry.value}>{entry.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rapid-note panel-soft">
              <p>
                This round will generate 10 rapid MCQs, verify your score against the stored answer key, and produce a personalized report with weak topics and next steps.
              </p>
            </div>

            <button className="cta-button full-width" onClick={startRound} disabled={starting}>
              {starting ? <Loader2 size={18} className="spinner" /> : <Timer size={18} />}
              Start Rapid MCQ
            </button>
          </section>

          <aside className="panel rapid-side-panel">
            <div className="rapid-stat">
              <span>Selected topic</span>
              <strong>{topicName}</strong>
            </div>
            <div className="rapid-stat">
              <span>Level</span>
              <strong>{LEVELS.find((entry) => entry.value === level)?.label}</strong>
            </div>
            <div className="rapid-stat">
              <span>Format</span>
              <strong>10s per question</strong>
            </div>
            <div className="rapid-stat">
              <span>Outcome</span>
              <strong>Backend grading + AI report</strong>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (result) {
    const report = result.report || {};
    const questionResults = result.question_results || [];

    return (
      <div className="rapid-page">
        <div className="rapid-header panel">
          <div>
            <span className="eyebrow">Rapid MCQ Result</span>
            <h1>{topicName}</h1>
            <Typewriter 
              text={report.summary || 'Your AI-verified report is ready.'} 
              speed={10} 
              showCursor={false}
            />
          </div>
          <div className="hero-actions">
            <button className="mini-button">
              <Trophy size={16} />
              {result.grade} performance
            </button>
            <button className="mini-button" onClick={restartRound}>
              <RotateCcw size={16} />
              Retry round
            </button>
          </div>
        </div>

        <div className="rapid-result-grid">
          <section className="panel result-hero panel-highlight">
            <div className="result-score">
              <div>
                <span>Score</span>
                <strong>{result.score}/{result.total_questions}</strong>
              </div>
              <div>
                <span>Grade</span>
                <strong>{result.grade}</strong>
              </div>
              <div>
                <span>Accuracy</span>
                <strong>{result.accuracy}%</strong>
              </div>
            </div>
            <div className="result-feedback">
              <h3>Personalized feedback</h3>
              <Typewriter 
                text={report.personalizedFeedback} 
                speed={15} 
              />
            </div>
            <div className="tag-row">
              {(result.focus_topics || []).map((item) => <span className="status-pill active" key={item}>{item.replace('_', ' ')}</span>)}
            </div>
          </section>

          <aside className="panel result-side">
            <div className="result-block">
              <h4>Strengths</h4>
              <ul>
                {(report.strengths || []).map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            </div>
            <div className="result-block">
              <h4>Improvement areas</h4>
              <ul>
                {(report.improvements || []).map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            </div>
            <div className="result-block">
              <h4>Next step</h4>
              <p>{report.nextStep}</p>
            </div>
          </aside>
        </div>

        <div className="panel review-panel">
          <div className="section-header compact">
            <div>
              <h3>Question review</h3>
              <p>Each answer is graded by the backend answer key.</p>
            </div>
          </div>
          <div className="review-list">
            {questionResults.map((item) => (
              <article className="review-card" key={item.questionId}>
                <div className="review-head">
                  <strong>{item.question}</strong>
                  {item.isCorrect ? <CheckCircle2 size={18} className="success-icon" /> : <XCircle size={18} className="error-icon" />}
                </div>
                <p>
                  Your answer: {item.selectedAnswer || 'No answer'}
                </p>
                <p>
                  Correct answer: {item.correctAnswer}
                </p>
                <small>{item.explanation}</small>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = selectedAnswers[selectedQuestion?.id];

  return (
    <div className="rapid-page">
      <div className="rapid-header panel">
        <div>
          <span className="eyebrow">Rapid MCQ</span>
          <h1>{topicName}</h1>
          <p>Answer fast. The backend checks your answers and produces the final report.</p>
        </div>
        <div className={`timer-chip ${timeLeft <= 3 ? 'danger' : ''}`}>
          <Timer size={18} />
          <strong>{timeLeft}s</strong>
        </div>
      </div>

      <div className="rapid-grid">
        <section className="panel mcq-shell">
          <div className="mcq-shell-head">
            <div>
              <span className="eyebrow">Question {currentIndex + 1} of {questions.length}</span>
              <h2>{selectedQuestion?.question}</h2>
              <p className="question-focus">Focus: {selectedQuestion?.focusArea || topicName}</p>
            </div>
            <div className="mcq-progress">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  className={`progress-dot ${index === currentIndex ? 'active' : ''} ${selectedAnswers[question.id] !== undefined ? 'answered' : ''}`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setTimeLeft(10);
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="option-list">
            {selectedQuestion?.options?.map((option, index) => (
              <button
                key={option}
                type="button"
                className={`mcq-option ${currentAnswer === index ? 'selected' : ''}`}
                onClick={() => selectAnswer(selectedQuestion.id, index)}
              >
                <span className="option-index">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
                {currentAnswer === index && <CheckCircle2 size={18} />}
              </button>
            ))}
          </div>

          <div className="mcq-actions">
            <button className="mini-button" onClick={() => navigate('/')} type="button">
              Back to dashboard
            </button>
            <button className="cta-button" onClick={goNext} type="button" disabled={submitting}>
              {currentIndex >= questions.length - 1 ? 'Submit round' : 'Next question'}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <aside className="panel rapid-side-panel live-panel">
          <div className="rapid-stat">
            <span>Topic</span>
            <strong>{topicName}</strong>
          </div>
          <div className="rapid-stat">
            <span>Level</span>
            <strong>{LEVELS.find((entry) => entry.value === level)?.label}</strong>
          </div>
          <div className="rapid-stat">
            <span>Answered</span>
            <strong>{answeredCount}/{questions.length}</strong>
            <div className="course-progress-track">
              <div className="course-progress-fill" style={{ width: `${answeredPercent}%` }} />
            </div>
          </div>
          <div className="rapid-stat">
            <span>Mode</span>
            <strong>{submitting ? 'Verifying' : 'Live'}</strong>
          </div>
          <div className="rapid-note compact-note">
            AI generates the questions, the backend verifies the score, and the report highlights what to improve next.
          </div>
          {submitting && (
            <div className="page-loading inline">
              <Loader2 className="spinner" size={18} />
              <p>Verifying answers...</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default RapidMCQ;