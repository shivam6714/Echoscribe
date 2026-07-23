import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateInsights, generateUserTimeframeData } from '../services/speechEngine';
import { MetricCard } from '../components/MetricCard';
import { ChartMock } from '../components/ChartMock';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Zap, 
  Sparkles,
  Info
} from 'lucide-react';

export const Analytics = () => {
  const { history, trainingProgress, rehabStats } = useApp();
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily', 'weekly', 'monthly'

  // Dynamic analytics insights strictly from real data
  const insights = generateInsights(history, trainingProgress, rehabStats);

  // Dynamic timeframe chart datasets strictly from real data
  const timeframeData = generateUserTimeframeData(history, rehabStats, timeframe);
  const selectedActivity = timeframeData.activity;
  const selectedAccuracy = timeframeData.accuracy;

  const hasData = history.length > 0 || (rehabStats.exercisesCompleted || 0) > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <section className="flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
            Speech Analytics & Progress
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-md)', margin: 0 }}>
            Real-time speech clarity trends and transcription performance calculated dynamically from your activity.
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          display: 'flex',
          gap: '2px',
          border: '1px solid var(--color-border)'
        }}>
          {['daily', 'weekly', 'monthly'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className="btn"
              style={{
                fontSize: 'var(--font-xs)',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: timeframe === t ? 'var(--color-primary)' : 'transparent',
                color: timeframe === t ? '#FFFFFF' : 'var(--color-text-muted)',
                boxShadow: timeframe === t ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {!hasData && (
        <div className="card" style={{
          backgroundColor: 'rgba(231, 111, 81, 0.05)',
          borderColor: 'rgba(231, 111, 81, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem 1.5rem'
        }}>
          <Info size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 'var(--font-sm)', marginBottom: '2px' }}>
              No speech activity recorded yet
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
              Analytics charts and metrics update dynamically when you perform live translations in Live Mode or practice in Rehabilitation.
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-4 gap-3">
        <MetricCard
          title="Improvement Score"
          value={`${insights.improvementScore}%`}
          icon={TrendingUp}
          description="Rate of speech clarity increase."
        />
        <MetricCard
          title="Avg Confidence"
          value={`${insights.averageConfidence}%`}
          icon={Sparkles}
          description="Model's speech prediction reliability."
        />
        <MetricCard
          title="Success Rate"
          value={`${insights.successRate}%`}
          icon={CheckCircle}
          description="Transcripts requiring zero adjustments."
        />
        <MetricCard
          title="Training Progress"
          value={`${trainingProgress.readinessScore}%`}
          icon={Zap}
          description="Completed phoneme voice profiles."
        />
      </div>

      {/* Charts Display */}
      <div className="grid grid-2 gap-3">
        
        {/* Chart 1: Accuracy Curve */}
        <div className="card">
          <div className="flex justify-between align-center" style={{ marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)' }}>
              Speech Clarity Curve ({timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})
            </h3>
          </div>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Historical transcription accuracy percentages.
          </p>
          <ChartMock type="line" data={selectedAccuracy} height={200} />
        </div>

        {/* Chart 2: Session Activity count */}
        <div className="card">
          <div className="flex justify-between align-center" style={{ marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)' }}>
              Transcription Activity
            </h3>
            <span className="badge badge-primary" style={{ fontSize: '10px' }}>
              {history.length} Sessions Total
            </span>
          </div>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Translation & practice requests processed.
          </p>
          <ChartMock type="bar" data={selectedActivity} height={200} unit=" tx" />
        </div>

      </div>

      {/* Insights Panel */}
      <div className="grid grid-3 gap-3" style={{ alignItems: 'start' }}>
        
        {/* Core Insights card */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>
            Dynamic Speech Insights
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {insights.insightsList.map((item, idx) => (
              <div key={idx} className="flex gap-3 align-center" style={{
                padding: '0.75rem 0',
                borderBottom: idx < insights.insightsList.length - 1 ? '1px solid var(--color-border)' : 'none'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: item.type === 'primary' 
                    ? 'var(--color-primary)' 
                    : item.type === 'accent' 
                    ? 'var(--color-accent)' 
                    : 'var(--color-warning)'
                }} />
                <div style={{ fontSize: 'var(--font-sm)', flex: 1, color: 'var(--color-text)' }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Corrections frequency card */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            Top Vocabulary Corrections
          </h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Most frequently used speech shortcuts.
          </p>

          {insights.commonCorrections.length === 0 ? (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              No custom dictionary items recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insights.commonCorrections.map((item, idx) => (
                <div key={idx} className="flex justify-between align-center" style={{ fontSize: 'var(--font-sm)', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 500 }}>"{item.phrase}"</span>
                  <span className="badge badge-success">{item.count} times</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
