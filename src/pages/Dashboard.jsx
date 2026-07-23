import React from 'react';
import { useApp } from '../context/AppContext';
import { generateUserTimeframeData } from '../services/speechEngine';
import { MetricCard } from '../components/MetricCard';
import { ActionCard } from '../components/ActionCard';
import { ChartMock } from '../components/ChartMock';
import { 
  Mic, 
  Sparkles, 
  Activity, 
  History, 
  ShieldAlert, 
  TrendingUp, 
  Award,
  BookOpen,
  Phone,
  UserPlus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { history, trainingProgress, rehabStats, achievements } = useApp();
  const [primaryContact, setPrimaryContact] = React.useState(null);
  const [directDialerBypass, setDirectDialerBypass] = React.useState(() => {
    return localStorage.getItem('echoscribe_direct_dial_bypass') === 'true';
  });

  React.useEffect(() => {
    const loadPrimaryContact = () => {
      const storedContacts = localStorage.getItem('emergencyContacts');
      const storedPrimaryId = localStorage.getItem('primaryEmergencyContactId');
      const bypassVal = localStorage.getItem('echoscribe_direct_dial_bypass') === 'true';
      if (storedContacts && storedPrimaryId) {
        const parsed = JSON.parse(storedContacts);
        const found = parsed.find(c => c.id === storedPrimaryId);
        setPrimaryContact(found || null);
        if (found && found.phone) {
          if ('caches' in window) {
            caches.open('echoscribe-contacts').then((cache) => {
              cache.put('/api/primary-phone', new Response(found.phone));
              cache.put('/api/direct-dial-bypass', new Response(String(bypassVal)));
            }).catch((err) => console.warn('Cache write failed:', err));
          }
        }
      } else {
        setPrimaryContact(null);
      }
    };
    loadPrimaryContact();
    window.addEventListener('emergency-contacts-updated', loadPrimaryContact);

    const handleSettingsUpdate = () => {
      const bypassVal = localStorage.getItem('echoscribe_direct_dial_bypass') === 'true';
      setDirectDialerBypass(bypassVal);
      if ('caches' in window) {
        caches.open('echoscribe-contacts').then((cache) => {
          cache.put('/api/direct-dial-bypass', new Response(String(bypassVal)));
        }).catch((err) => console.warn('Cache write failed:', err));
      }
    };
    window.addEventListener('emergency-settings-updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('emergency-contacts-updated', loadPrimaryContact);
      window.removeEventListener('emergency-settings-updated', handleSettingsUpdate);
    };
  }, []);

  // Get last 3 transcriptions
  const recentHistory = history.slice(0, 3);

  // Calculate training completion
  const trainingCompletePct = trainingProgress.readinessScore;

  // Calculate average confidence score (Communication Score)
  const totalLogs = history.length;
  const avgConfidence = totalLogs > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / totalLogs)
    : (rehabStats.clarityScore || 0);

  // Last live session info
  const lastSessionItem = history[0];
  const lastSessionDate = lastSessionItem
    ? new Date(lastSessionItem.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : 'No sessions';
  const lastSessionText = lastSessionItem
    ? `Last speech: "${lastSessionItem.corrected}"`
    : 'Start a Live Mode session to begin.';

  // Dynamic Chart data for weekly improvements
  const timeframeData = generateUserTimeframeData(history, rehabStats, 'weekly');
  const weeklyImprovementData = timeframeData.accuracy;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* 1. Welcome Card / SOS Calling Widget */}
      <section style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
        alignItems: 'stretch'
      }} className="welcome-grid">
        <div style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '2rem',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1rem',
          flex: 1
        }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-3xl)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem', lineHeight: '1.2' }}>
              Welcome back to EchoScribe
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-md)', maxWidth: '600px', margin: 0 }}>
              Your speech model is ready. Practice rehab drills, train custom command shortcuts, or view real-time speech analytics.
            </p>
          </div>
        </div>

        {/* SOS Speed Dial Widget (styled like a clock widget) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          minHeight: '180px'
        }} className="sos-dashboard-widget">
          {primaryContact ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                SOS Call Widget
              </span>
              
              <button
                onClick={() => {
                  if (directDialerBypass) {
                    navigate('/direct-call');
                  } else {
                    navigate('/emergency');
                  }
                }}
                className="pulse-call"
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: '4px solid var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
                  transition: 'transform 0.1s ease',
                  outline: 'none'
                }}
                title={directDialerBypass ? `Call ${primaryContact.name}` : 'Open Emergency Safety Hub'}
              >
                <Phone size={36} />
              </button>

              <div style={{ marginTop: '4px' }}>
                <div style={{ fontWeight: 'bold', fontSize: 'var(--font-md)', color: 'var(--color-text)', lineHeight: '1.2' }}>
                  {primaryContact.name}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {primaryContact.relationship}
                </div>
                <div style={{ fontSize: '10px', color: directDialerBypass ? '#DC2626' : 'var(--color-primary)', fontWeight: 'bold', marginTop: '4px' }}>
                  {directDialerBypass ? '📞 Taps dial phone' : '🛡️ Taps open Safety Hub'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                SOS Call Widget
              </span>

              <Link
                to="/emergency"
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--color-text-muted)',
                  border: '3px dashed var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  outline: 'none'
                }}
              >
                <UserPlus size={32} />
              </Link>

              <div style={{ marginTop: '4px' }}>
                <div style={{ fontWeight: 'bold', fontSize: 'var(--font-sm)', color: 'var(--color-text)' }}>
                  No Primary Contact
                </div>
                <Link to="/emergency" style={{ fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                  Set Up Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Core Metrics Grid */}
      <section>
        <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>
          System & Progress Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <MetricCard
            title="Model Readiness"
            value={`${trainingCompletePct}%`}
            icon={Mic}
            progress={trainingCompletePct}
            description="Completing training phrases increases correction accuracy."
          />
          <MetricCard
            title="Communication Score"
            value={`${avgConfidence}%`}
            icon={Activity}
            progress={avgConfidence}
            description="Average confidence score across all speech logs."
          />
          <MetricCard
            title="Live Mode Usage"
            value={`${totalLogs} Conversations`}
            icon={Sparkles}
            description="Total conversations captured and corrected in real time."
          />
          <MetricCard
            title="Last Live Session"
            value={lastSessionDate}
            icon={History}
            description={lastSessionText}
          />
        </div>
      </section>

      {/* 3. Main Split Section: Weekly Chart & Quick Actions */}
      <div className="grid grid-2 gap-3">
        {/* Weekly Improvement Chart Card */}
        <div className="card">
          <div className="flex justify-between align-center" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)' }}>
              Weekly Improvement Trend
            </h3>
            <span className="badge badge-success flex align-center gap-1">
              <TrendingUp size={12} /> +12% Clarity
            </span>
          </div>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Track your speech adaptation and clarity scores over the last 7 sessions.
          </p>
          <ChartMock type="line" data={weeklyImprovementData} height={180} />
        </div>

        {/* Quick Actions Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <ActionCard
            title="Live Mode"
            description="Open the real-time transcription board."
            icon={Sparkles}
            to="/transcription"
            buttonText="Start"
          />
          <ActionCard
            title="Rehab Drills"
            description="Practice daily sentence articulation."
            icon={Activity}
            to="/rehab"
            buttonText="Practice"
          />
          <ActionCard
            title="Custom Dictionary"
            description="Manage your personalized word maps."
            icon={BookOpen}
            to="/accessibility"
            buttonText="Edit"
          />
          <ActionCard
            title="Emergency Alert"
            description="Quick access buttons for emergency response."
            icon={ShieldAlert}
            to="/emergency"
            buttonText="View"
          />
        </div>
      </div>

      {/* 4. Recent Corrections List */}
      <section className="card" style={{ padding: '1.5rem 2rem' }}>
        <div className="flex justify-between align-center" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-display)' }}>
            Recent Corrections
          </h3>
          <Link to="/history" style={{ fontSize: 'var(--font-sm)', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            View All History &rarr;
          </Link>
        </div>

        {recentHistory.length === 0 ? (
          <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
            No recent corrections. Go to Live Mode page to translate spoken phrases.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Original Input</th>
                  <th style={{ padding: '10px 8px' }}>Corrected Output</th>
                  <th style={{ padding: '10px 8px' }}>Confidence</th>
                  <th style={{ padding: '10px 8px' }}>Method</th>
                  <th style={{ padding: '10px 8px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--color-text)' }}>"{item.original}"</td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-accent)', fontWeight: 600 }}>"{item.corrected}"</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${item.confidence >= 90 ? 'badge-success' : 'badge-warning'}`}>
                        {item.confidence}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: 'var(--color-text-muted)' }}>{item.method}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        @media (min-width: 768px) {
          .welcome-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
        @keyframes pulse-sos-widget {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4), 0 4px 15px rgba(220, 38, 38, 0.3);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0), 0 4px 15px rgba(220, 38, 38, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 4px 15px rgba(220, 38, 38, 0.3);
          }
        }
        .pulse-call {
          animation: pulse-sos-widget 2s infinite;
        }
        .pulse-call:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};
