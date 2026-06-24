import React, { useEffect } from 'react';

export const DirectCall = () => {
  useEffect(() => {
    const storedContacts = localStorage.getItem('emergencyContacts');
    const storedPrimaryId = localStorage.getItem('primaryEmergencyContactId');
    if (storedContacts && storedPrimaryId) {
      const parsed = JSON.parse(storedContacts);
      const found = parsed.find(c => c.id === storedPrimaryId);
      if (found && found.phone) {
        // Create an anchor with target="_blank" to bypass the PWA scope-exit prompt
        const link = document.createElement('a');
        link.href = `tel:${found.phone}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Wait a brief moment to let the dialer open, then redirect the app back to safety hub
        setTimeout(() => {
          window.location.replace('#/emergency');
        }, 1000);
      } else {
        window.location.replace('#/emergency');
      }
    } else {
      window.location.replace('#/emergency');
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#FAF7F2',
      color: '#2D3436',
      fontFamily: 'var(--font-primary)',
      padding: '2rem',
      textAlign: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        color: '#DC2626',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        marginBottom: '1rem',
        animation: 'pulse-sos-widget 1.5s infinite'
      }}>
        📞
      </div>
      <h2 style={{ fontSize: 'var(--font-xl)', color: '#DC2626', fontWeight: 'bold', margin: 0 }}>
        Dialing Emergency...
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: 'var(--font-sm)' }}>
        Opening your device dialer directly.
      </p>
      
      <style>{`
        @keyframes pulse-sos-widget {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>
    </div>
  );
};
