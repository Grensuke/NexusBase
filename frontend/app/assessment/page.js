'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { getAssessmentQuestions, submitAssessment, getMyAssessments } from '@/lib/api';
import styles from './assessment.module.css';

/* Shuffle the OPTIONS of each question so the correct answer
   is not always option A.  Returns shuffled questions plus a
   mapping so we can convert the user's display-order selection
   back to the canonical index the server expects.              */
function shuffleOptions(serverQuestions) {
  return serverQuestions.map(q => {
    // Build index array [0,1,2,3] and shuffle it
    const indices = q.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return {
      q:             q.q,
      options:       indices.map(i => q.options[i]),  // shuffled display order
      canonicalMap:  indices,                          // canonicalMap[displayIdx] = canonicalIdx
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

  const [phase,       setPhase]       = useState('intro');   // intro | loading | quiz | result
  const [answers,     setAnswers]     = useState({});        // { questionIndex: displayOptionIndex }
  const [current,     setCurrent]     = useState(0);
  const [result,      setResult]      = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [history,     setHistory]     = useState([]);
  const [redirecting, setRedirecting] = useState(false);
  const [questions,   setQuestions]   = useState([]);        // shuffled questions from server

  // Start / restart the quiz — fetch questions from the server
  const startQuiz = async () => {
    setPhase('loading');
    try {
      const { data } = await getAssessmentQuestions(skillId);
      setQuestions(shuffleOptions(data.questions));
      setAnswers({});
      setCurrent(0);
      setPhase('quiz');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load questions', 'error');
      setPhase('intro');
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'freelancer')) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getMyAssessments().then(r => setHistory(r.data || [])).catch(() => {});
    }
  }, [user]);

  const handleAnswer = (qIdx, displayIdx) => {
    setAnswers(a => ({ ...a, [qIdx]: displayIdx }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      // Convert display-order selections to canonical-order indices
      // The server expects canonical indices (matching the order it returned)
      const canonicalAnswers = questions.map((q, i) => {
        const displayIdx = answers[i];
        return q.canonicalMap[displayIdx];   // map back to canonical index
      });

      const { data } = await submitAssessment(skillId, canonicalAnswers);
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

  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);
  const progressPct = questions.length > 0 ? Math.round(((current + 1) / questions.length) * 100) : 0;

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
                Answer 5 multiple-choice questions. A score of 70% or above
                marks this skill as verified and boosts your trust score immediately.
              </p>
              <div className={styles.rules}>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />5 questions · ~3 minutes</div>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />Pass threshold: 70%</div>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />You may retake any time</div>
                <div className={styles.ruleItem}><span className={styles.ruleDot} />Scored server-side — answers are graded on the backend</div>
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

  // ── Loading screen ──
  if (phase === 'loading') return (
    <div className="page-wrapper">
      <main>
        <div className={styles.page}>
          <div className={`container ${styles.center}`}>
            <div className={styles.card} style={{ maxWidth: 520, textAlign: 'center' }}>
              <div className={styles.skillBadge}>{skillName[0]}</div>
              <h2 className={styles.cardTitle}>Loading Questions…</h2>
              <p className={styles.cardDesc}>Fetching your {skillName} assessment from the server.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // ── Quiz screen ──
  if (phase === 'quiz' && questions.length > 0) {
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
                    ? `You answered ${result.correct}/${result.total} correctly. Your ${skillName} skill is now verified and has been added to your profile. Redirecting to dashboard…`
                    : `You scored ${pct}% (${result.correct}/${result.total} correct). The pass threshold is 70%. You can retake this assessment any time.`
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
