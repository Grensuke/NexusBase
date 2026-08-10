'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { submitAssessment, getMyAssessments } from '@/lib/api';
import styles from './assessment.module.css';

/* ---------- Simulated question bank ----------
   In production these come from a quiz engine.
   For the viva demo, 5 questions per skill covers
   the full UI flow without a real quiz backend.   */
const SKILL_QUESTIONS = {
  default: [
    { q: 'What is the primary purpose of this skill?', options: ['Produce deliverables', 'Write documentation', 'Attend meetings', 'File reports'], correct: 0 },
    { q: 'Which best practice is most important in this domain?', options: ['Version control', 'Skipping tests', 'Ignoring feedback', 'Avoiding tools'], correct: 0 },
    { q: 'How do you handle client revision requests?', options: ['Discuss scope then revise', 'Ignore them', 'Charge triple', 'Quit the project'], correct: 0 },
    { q: 'What makes a deliverable "complete"?', options: ['It meets the agreed spec', 'It looks nice', 'You ran out of time', 'Client stopped responding'], correct: 0 },
    { q: 'Which is the correct approach for a tight deadline?', options: ['Communicate early & prioritize', 'Overcommit silently', 'Miss the deadline', 'Blame tooling'], correct: 0 },
  ],
  React: [
    { q: 'What hook manages component state in React?', options: ['useState', 'useEffect', 'useRef', 'useMemo'], correct: 0 },
    { q: 'Which lifecycle is equivalent to componentDidMount?', options: ['useEffect(fn, [])', 'useEffect(fn)', 'useMemo(fn, [])', 'useCallback(fn)'], correct: 0 },
    { q: 'What does the key prop help React with?', options: ['Efficient list reconciliation', 'CSS styling', 'Event binding', 'Server rendering'], correct: 0 },
    { q: 'Which statement about React props is true?', options: ['They flow parent → child', 'They are mutable', 'They flow child → parent', 'They require Redux'], correct: 0 },
    { q: 'What is the Virtual DOM?', options: ['An in-memory representation of the real DOM', 'A browser API', 'A CSS engine', 'A bundler plugin'], correct: 0 },
  ],
  'Node.js': [
    { q: 'What module system does Node.js primarily use?', options: ['CommonJS (require)', 'AMD', 'SystemJS', 'UMD'], correct: 0 },
    { q: 'Which method reads a file asynchronously?', options: ['fs.readFile', 'fs.readFileSync', 'fs.open', 'path.read'], correct: 0 },
    { q: 'What is the event loop responsible for?', options: ['Non-blocking I/O handling', 'Garbage collection', 'Module loading', 'Memory allocation'], correct: 0 },
    { q: 'Which tool manages Node.js packages?', options: ['npm / yarn', 'pip', 'cargo', 'gem'], correct: 0 },
    { q: 'What does process.env give you?', options: ['Environment variables', 'Process arguments', 'System PATH', 'File descriptors'], correct: 0 },
  ],
  SEO: [
    { q: 'What does SEO stand for?', options: ['Search Engine Optimization', 'Secure Element Output', 'Site Engagement Order', 'Server Error Output'], correct: 0 },
    { q: 'Which tag is most important for on-page SEO?', options: ['<title>', '<meta name="keywords">', '<h5>', '<footer>'], correct: 0 },
    { q: 'What is a backlink?', options: ['A link from another site to yours', 'An internal nav link', 'A CSS anchor', 'A broken link'], correct: 0 },
    { q: 'What does a 301 redirect signal to search engines?', options: ['Permanent move', 'Temporary move', 'Not found', 'Server error'], correct: 0 },
    { q: 'Which metric measures page load performance?', options: ['Core Web Vitals', 'Bounce rate alone', 'Session duration', 'Click-through rate'], correct: 0 },
  ],
};

function getQuestions(skillName) {
  return SKILL_QUESTIONS[skillName] || SKILL_QUESTIONS.default;
}

/* Shuffle the OPTIONS of each question so the correct answer
   is not always option A. The source data keeps correct:0 for
   readability; this function randomises the displayed order.   */
function shuffleQuestions(rawQuestions) {
  return rawQuestions.map(q => {
    // Build index array [0,1,2,3] and shuffle it
    const indices = q.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Map shuffled indices back to options and track new correct position
    return {
      q:       q.q,
      options: indices.map(i => q.options[i]),
      correct: indices.indexOf(q.correct),   // where did the correct answer land?
    };
  });
}

function ScoreGauge({ pct }) {
  const color = pct >= 70 ? 'var(--success-light)' : 'var(--error-light)';
  return (
    <div className={styles.gauge}>
      <svg viewBox="0 0 120 70" className={styles.gaugeSvg}>
        <path d="M 10 70 A 60 60 0 0 1 110 70" fill="none" stroke="var(--surface-raised)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 10 70 A 60 60 0 0 1 110 70"
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 157} 157`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className={styles.gaugeValue} style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function AssessmentPage({ searchParams: searchParamsProp }) {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const { showToast } = useToast();

  // Next.js 16: searchParams is a Promise — unwrap with use()
  const searchParams = use(searchParamsProp);

  // skill info from query params: ?skill_id=1&skill_name=React
  const skillId   = searchParams?.skill_id ? parseInt(searchParams.skill_id, 10) : null;
  const skillName = searchParams?.skill_name || 'General';

  const [phase,     setPhase]     = useState('intro');   // intro | quiz | result
  const [answers,   setAnswers]   = useState({});
  const [current,   setCurrent]   = useState(0);
  const [result,    setResult]    = useState(null);
  const [submitting,setSubmitting]= useState(false);
  const [history,   setHistory]   = useState([]);
  const [redirecting, setRedirecting] = useState(false);
  // questions is stored in state so shuffle is stable per attempt
  const [questions, setQuestions] = useState(() => shuffleQuestions(getQuestions(skillName)));

  // Shuffle + reset — called on Start and Retake
  const startQuiz = () => {
    setQuestions(shuffleQuestions(getQuestions(skillName)));
    setAnswers({});
    setCurrent(0);
    setPhase('quiz');
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'freelancer')) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getMyAssessments().then(r => setHistory(r.data || [])).catch(() => {});
    }
  }, [user]);

  const handleAnswer = (qIdx, aIdx) => {
    setAnswers(a => ({ ...a, [qIdx]: aIdx }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const correct = questions.filter((q, i) => answers[i] === q.correct).length;
      const score   = Math.round((correct / questions.length) * 100);

      const { data } = await submitAssessment(skillId, score);
      setResult(data);
      setPhase('result');

      // On pass: auto-redirect to dashboard after 2.5 s so skills update is visible
      if (data.passed) {
        setRedirecting(true);
        setTimeout(() => router.push('/dashboard'), 2500);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);
  const progressPct = Math.round(((current + 1) / questions.length) * 100);

  // ── Intro screen ──
  if (phase === 'intro') return (
    <div className="page-wrapper">
      <main>
        <div className={styles.page}>
          <div className={`container ${styles.center}`}>
            <div className={styles.card} style={{ maxWidth: 560 }}>
              <div className={styles.skillBadge}>{skillName[0]}</div>
              <h1 className={styles.cardTitle}>{skillName} Assessment</h1>
              <p className={styles.cardDesc}>
                Answer {questions.length} multiple-choice questions. A score of 70% or above
                marks this skill as verified and boosts your trust score immediately.
              </p>
              <div className={styles.rules}>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />5 questions · ~3 minutes</div>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />Pass threshold: 70%</div>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />You may retake any time</div>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />Triggers immediate trust-score recalculation</div>
              </div>
              {!skillId && (
                <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
                  Open this page from your skills panel for a specific skill ID.
                </div>
              )}
              <button
                className="btn btn-primary"
                id="start-assessment-btn"
                onClick={startQuiz}
                disabled={!skillId}
              >
                Start Assessment
              </button>
            </div>

            {history.length > 0 && (
              <div className={styles.historyCard}>
                <h2 className={styles.historyTitle}>Past Assessments</h2>
                <div className={styles.historyList}>
                  {history.slice(0, 8).map(h => (
                    <div key={h.assessment_id} className={styles.historyRow} id={`assessment-${h.assessment_id}`}>
                      <span className={styles.historySkill}>{h.skill_name}</span>
                      <span className={styles.historyScore}>{h.score}%</span>
                      <span className={`badge ${h.passed ? 'badge-completed' : 'badge-cancelled'}`}>
                        {h.passed ? 'Passed' : 'Failed'}
                      </span>
                      <span className={styles.historyDate}>{new Date(h.taken_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );

  // ── Quiz screen ──
  if (phase === 'quiz') {
    const q = questions[current];
    return (
      <div className="page-wrapper">
        <main>
          <div className={styles.page}>
            <div className={`container ${styles.center}`}>
              <div className={styles.card} style={{ maxWidth: 620 }}>

                {/* Progress bar */}
                <div className={styles.quizProgress}>
                  <span className={styles.quizStep}>{current + 1} / {questions.length}</span>
                  <div className={styles.quizTrack}>
                    <div className={styles.quizFill} style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <h2 className={styles.question} id={`question-${current}`}>{q.q}</h2>

                <div className={styles.options}>
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      id={`option-${current}-${i}`}
                      className={`${styles.option} ${answers[current] === i ? styles.optionSelected : ''}`}
                      onClick={() => handleAnswer(current, i)}
                    >
                      <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  ))}
                </div>

                <div className={styles.quizActions}>
                  {current < questions.length - 1 ? (
                    <button
                      className="btn btn-primary"
                      onClick={handleNext}
                      disabled={answers[current] === undefined}
                      id="next-question-btn"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitQuiz}
                      disabled={!allAnswered || submitting}
                      id="submit-assessment-btn"
                    >
                      {submitting ? 'Submitting…' : 'Submit Assessment'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Result screen ──
  if (phase === 'result' && result) {
    const pct = result.score;
    return (
      <div className="page-wrapper">
        <main>
          <div className={styles.page}>
            <div className={`container ${styles.center}`}>
              <div className={styles.card} id="assessment-result" style={{ maxWidth: 520 }}>

                <ScoreGauge pct={pct} />

                <div className={`badge ${result.passed ? 'badge-completed' : 'badge-cancelled'}`} style={{ fontSize: '1rem', padding: '0.4rem 1rem', margin: '0 auto' }}>
                  {result.passed ? '✓ Passed' : '✗ Failed'}
                </div>

                <h1 className={styles.resultTitle}>
                  {result.passed ? 'Skill Verified!' : 'Keep Practising'}
                </h1>

                <p className={styles.resultDesc}>
                  {result.passed
                    ? `Your ${skillName} skill is now verified and has been added to your profile. Redirecting to dashboard…`
                    : `You scored ${pct}%. The pass threshold is 70%. You can retake this assessment any time.`
                  }
                </p>

                {result.trust_snapshot && (
                  <div className={styles.snapshotCard}>
                    <div className={styles.snapRow}>
                      <span className={styles.snapLabel}>Trust Score</span>
                      <span className={styles.snapVal}>{parseFloat(result.trust_snapshot.trust_score).toFixed(1)}</span>
                    </div>
                    <div className={styles.snapRow}>
                      <span className={styles.snapLabel}>Current Tier</span>
                      <span className={styles.snapVal}>{result.trust_snapshot.tier_name}</span>
                    </div>
                    <div className={styles.snapRow}>
                      <span className={styles.snapLabel}>Commission</span>
                      <span className={styles.snapVal}>{parseFloat(result.trust_snapshot.commission_rate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                <div className={styles.resultActions}>
                  <button className="btn btn-secondary" onClick={startQuiz}>
                    Retake
                  </button>
                  <button className="btn btn-primary" onClick={() => router.push('/dashboard')} id="back-to-dashboard-btn">
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
