import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/MetricCard';
import { ChartMock } from '../components/ChartMock';
import { 
  Activity, 
  Play, 
  Mic, 
  CheckCircle, 
  Award,
  Sparkles,
  Zap,
  RotateCcw,
  Volume2
} from 'lucide-react';

const REHAB_EXERCISES = [
  {
    id: 'ex_1',
    name: 'Vowel Projection Drill',
    description: 'Sustain vowel sounds to strengthen chest voice resonance and breath control.',
    targetText: 'Ah - Eh - Ee - Oh - Oo',
    duration: '20 seconds',
    hint: 'Hold each vowel clearly for 3 seconds. Maintain steady breath pressure.',
    category: 'Vocal Strength'
  },
  {
    id: 'ex_2',
    name: 'Consonant Articulation Drill',
    description: 'Train lip and tongue placement for crisp consonant sound separations.',
    targetText: 'Peter Piper picked a peck of pickled peppers.',
    duration: '15 seconds',
    hint: 'Over-articulate the "P" sounds. Ensure each word has distinct separation.',
    category: 'Clarity & Precision'
  },
  {
    id: 'ex_3',
    name: 'Daily Sentence Pacing',
    description: 'Practice taking structured breaths between phrases for natural speaking cadences.',
    targetText: 'Please call Mom [breath] and check if the mail arrived.',
    duration: '30 seconds',
    hint: 'Inhale deeply at the [breath] marker. Do not rush the second half.',
    category: 'Breath Control'
  }
];

export const Rehabilitation = () => {
  const { rehabStats, completeDailyExercise } = useApp();
  const [activeExercise, setActiveExercise] = useState(null); // The exercise being practiced
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDone, setRecordingDone] = useState(false);
  const [evaluationScore, setEvaluationScore] = useState(null);
  const [evaluationFeedback, setEvaluationFeedback] = useState('');
  
  const handleStartExercise = (exercise) => {
    setActiveExercise(exercise);
    setRecordingDone(false);
    setIsRecording(false);
    setEvaluationScore(null);
    setEvaluationFeedback('');
  };

  const handleRecordPractice = () => {
    setIsRecording(true);
    setRecordingDone(false);
    
    // Simulate speech collection duration
    setTimeout(() => {
      setIsRecording(false);
      setRecordingDone(true);
      
      // Calculate random high-quality score for demo
      const randomScore = Math.floor(Math.random() * (96 - 75 + 1)) + 75;
      setEvaluationScore(randomScore);
      
      // Select feedback based on score
      if (randomScore >= 90) {
        setEvaluationFeedback('Excellent clarity! Sound projection and consonant separation are well aligned.');
      } else if (randomScore >= 80) {
        setEvaluationFeedback('Good control. Try to extend your breath pacing slightly on the final syllables.');
      } else {
        setEvaluationFeedback('A solid effort. Try speaking slower and focusing on open vowel projection.');
      }
    }, 3500);
  };

  const handleSaveResult = () => {
    if (!activeExercise || !evaluationScore) return;
    
    completeDailyExercise(activeExercise.name, evaluationScore);
    
    // Close practice view and show success toast
    setRecordingDone(false);
    setEvaluationScore(null);
    setActiveExercise(null);
  };

  const handlePlayGuide = () => {
    if (!activeExercise) return;
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(activeExercise.targetText.replace('[breath]', ', '));
      utterance.rate = 0.85; // Speak slowly
      synth.speak(utterance);
    }
  };

  // Format historical exercise items for charts
  const historyChartData = rehabStats.history.slice(0, 7).reverse().map((item, idx) => ({
    label: `Ex ${idx + 1}`,
    value: item.score
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header */}
      <section>
        <h1 style={{ fontSize: 'var(--font-3xl)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
          Speech Rehabilitation Mode
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-md)' }}>
          Rebuild muscle memory and vocal coordination with daily target drills. Practice regularly to improve translation engine accuracy.
        </p>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-4 gap-3">
        <MetricCard
          title="Exercises Done"
          value={rehabStats.exercisesCompleted}
          description="Total completed drills."
        />
        <MetricCard
          title="Average Clarity"
          value={`${rehabStats.clarityScore}%`}
          description="Pronunciation accuracy score."
        />
        <MetricCard
          title="Vocal Consistency"
          value={`${rehabStats.consistency}%`}
          description="Steady tone maintenance."
        />
        <MetricCard
          title="Daily Streak"
          value={`${rehabStats.streak} Days`}
          icon={Zap}
          description="Consecutive practice days."
        />
      </div>

      <div className="grid grid-3 gap-3" style={{ alignItems: 'start' }}>
        
        {/* Left 2 Cols: Exercise Selection or active practice */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {activeExercise ? (
            /* Active Exercise Screen */
            <div className="card">
              <div className="flex justify-between align-center" style={{ marginBottom: '1.5rem' }}>
                <span className="badge badge-primary">{activeExercise.category}</span>
                <button 
                  onClick={() => setActiveExercise(null)} 
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: 'var(--font-xs)', borderRadius: 'var(--radius-sm)' }}
                >
                  &larr; Exit Practice
                </button>
              </div>

              <h2 style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
                {activeExercise.name}
              </h2>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                {activeExercise.description}
              </p>

              {/* Target Prompt Box */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Speak the phrase clearly:
                </span>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  "{activeExercise.targetText}"
                </h1>
                
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={handlePlayGuide}
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: 'var(--font-xs)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <Volume2 size={12} /> Play Audio Guide
                  </button>
                </div>
              </div>

              {/* Mic / Scoring visualizer */}
              <div className="flex flex-col align-center justify-center" style={{ minHeight: '160px', padding: '1rem 0' }}>
                {isRecording ? (
                  <div className="flex flex-col align-center gap-2">
                    <div className="flex align-center gap-1" style={{ height: '30px' }}>
                      <span className="wave-bar" style={{ animationDelay: '0.1s' }} />
                      <span className="wave-bar" style={{ height: '50px', animationDelay: '0.3s' }} />
                      <span className="wave-bar" style={{ height: '35px', animationDelay: '0.2s' }} />
                      <span className="wave-bar" style={{ height: '40px', animationDelay: '0.5s' }} />
                      <span className="wave-bar" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="pulse" style={{ fontSize: 'var(--font-sm)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      Listening to speech... articulation in progress
                    </span>
                  </div>
                ) : evaluationScore ? (
                  <div className="flex flex-col align-center text-center gap-2" style={{ maxWidth: '400px' }}>
                    <div className="flex align-center gap-2" style={{ marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(42, 157, 143, 0.1)',
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--font-2xl)',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        border: '3px solid var(--color-accent)'
                      }}>
                        {evaluationScore}%
                      </div>
                    </div>
                    <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 'bold' }}>Evaluation Complete!</h4>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                      {evaluationFeedback}
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={handleRecordPractice}
                    className="btn btn-primary"
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(231, 111, 81, 0.15)'
                    }}
                  >
                    <Mic size={32} />
                    <span style={{ fontSize: '10px', marginTop: '4px' }}>Practice</span>
                  </button>
                )}
              </div>

              {/* Action buttons */}
              {recordingDone && evaluationScore && (
                <div className="flex gap-3 justify-between" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                  <button 
                    onClick={handleRecordPractice}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    <RotateCcw size={16} /> Re-try Practice
                  </button>
                  <button 
                    onClick={handleSaveResult}
                    className="btn btn-accent"
                    style={{ flex: 1 }}
                  >
                    <CheckCircle size={16} /> Submit Result
                  </button>
                </div>
              )}

              {/* Practice Hints */}
              <div style={{ marginTop: '1.5rem', fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', borderLeft: '3px solid var(--color-secondary)', paddingLeft: '10px' }}>
                <strong>Tip:</strong> {activeExercise.hint}
              </div>
            </div>
          ) : (
            /* Exercise List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)' }}>
                Speech Drills
              </h3>
              
              {REHAB_EXERCISES.map((ex) => (
                <div key={ex.id} className="card flex align-center justify-between gap-3" style={{ padding: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div className="flex align-center gap-2" style={{ marginBottom: '0.5rem' }}>
                      <span className="badge badge-success" style={{ textTransform: 'none' }}>
                        {ex.category}
                      </span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                        Est: {ex.duration}
                      </span>
                    </div>
                    <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
                      {ex.name}
                    </h4>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      {ex.description}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleStartExercise(ex)}
                    className="btn btn-primary"
                    style={{ borderRadius: 'var(--radius-md)', padding: '8px 16px' }}
                  >
                    <Play size={14} fill="white" /> Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Exercise Analytics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)' }}>
            Practice History
          </h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
            Recent clarity scores recorded during speech exercises.
          </p>

          {rehabStats.history.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              No practice logs yet. Complete a speech drill to build your progress history.
            </div>
          ) : (
            <div>
              <ChartMock type="bar" data={historyChartData} height={140} />
              
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                  Activity Log:
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {rehabStats.history.slice(0, 5).map((log, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: 'var(--font-xs)', 
                      padding: '6px 0', 
                      borderBottom: '1px solid var(--color-border)' 
                    }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {log.exerciseName}
                      </div>
                      <div className="flex gap-2">
                        <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{log.score}%</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
