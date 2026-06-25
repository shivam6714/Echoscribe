import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, X } from 'lucide-react';

export const DirectCall = () => {
  const navigate = useNavigate();
  const [primaryContact, setPrimaryContact] = useState(null);

  useEffect(() => {
    const storedContacts = localStorage.getItem('emergencyContacts');
    const storedPrimaryId = localStorage.getItem('primaryEmergencyContactId');
    if (storedContacts && storedPrimaryId) {
      const parsed = JSON.parse(storedContacts);
      const found = parsed.find(c => c.id === storedPrimaryId);
      setPrimaryContact(found || null);
    }
  }, []);

  const handleCall = () => {
    if (primaryContact && primaryContact.phone) {
      // Create an anchor with target="_blank" to bypass the PWA scope-exit prompt
      const link = document.createElement('a');
      link.href = `tel:${primaryContact.phone}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Redirect back to emergency page after a small delay
      setTimeout(() => {
        navigate('/emergency', { replace: true });
      }, 1000);
    } else {
      navigate('/emergency', { replace: true });
    }
  };

  const handleCancel = () => {
    navigate('/dashboard', { replace: true });
  };

  if (!primaryContact) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#FAF7F2',
        color: '#2D3436',
        fontFamily: 'var(--font-primary)'
      }}>
        <p>Loading emergency contact details...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
      color: 'var(--color-text)',
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
      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--bg-card)',
        border: '3px solid #DC2626',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        <button 
          onClick={handleCancel}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          color: '#DC2626',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          marginBottom: '1rem',
          animation: 'pulse-sos-widget 1.5s infinite'
        }}>
          <Phone size={32} />
        </div>

        <h2 style={{ fontSize: 'var(--font-xl)', color: 'var(--color-text)', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
          Open Phone Dialer?
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', lineHeight: '1.4', margin: '0 0 1.5rem 0' }}>
          Do you want to launch your device's native dialer to call <strong>{primaryContact.name}</strong> ({primaryContact.phone})?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={handleCall}
            className="btn btn-primary"
            style={{
              backgroundColor: '#DC2626',
              borderColor: '#DC2626',
              color: '#FFF',
              fontWeight: 'bold',
              height: '52px',
              width: '100%',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-md)'
            }}
          >
            Open Dialer
          </button>
          
          <button 
            onClick={handleCancel}
            className="btn btn-secondary"
            style={{
              fontWeight: 'bold',
              height: '52px',
              width: '100%',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-sm)'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse-sos-widget {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
