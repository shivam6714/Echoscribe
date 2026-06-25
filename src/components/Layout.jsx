import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  LayoutDashboard, 
  Mic, 
  Sparkles, 
  Activity, 
  BarChart3, 
  History, 
  Accessibility as AccessibilityIcon, 
  ShieldAlert,
  Menu,
  X,
  Volume2,
  Database,
  Download,
  Phone,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { 
    accessibilitySettings, 
    trainingProgress, 
    loadDemoData, 
    demoLoaded,
    isInstallable,
    triggerInstall
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [primaryContact, setPrimaryContact] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [directDialerBypass, setDirectDialerBypass] = useState(() => {
    return localStorage.getItem('echoscribe_direct_dial_bypass') === 'true';
  });
  const location = useLocation();

  useEffect(() => {
    const handleAppInstalled = () => {
      setShowEncouragement(true);
      localStorage.setItem('echoscribe_just_installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    
    if (localStorage.getItem('echoscribe_just_installed') === 'true') {
      setShowEncouragement(true);
    }
    
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number)
      .then(() => {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2000);
      });
  };

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

  useEffect(() => {
    loadPrimaryContact();
    
    // Listen for custom events dispatched when contacts update
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

  // Desktop Navigation Items
  const navItems = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transcription', label: 'Live Mode', icon: Sparkles },
    { to: '/training', label: 'Training', icon: Mic },
    { to: '/rehab', label: 'Rehabilitation', icon: Activity },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/history', label: 'History', icon: History },
    { to: '/accessibility', label: 'Accessibility', icon: AccessibilityIcon },
    { to: '/emergency', label: 'Emergency Mode', icon: ShieldAlert },
  ];

  // Mobile Primary Bottom Navigation Items
  const bottomNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transcription', label: 'Live Mode', icon: Sparkles },
    { to: '/training', label: 'Training', icon: Mic },
    { to: '/rehab', label: 'Rehabilitation', icon: Activity },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Mobile Top Navbar */}
      <header style={{
        display: 'none',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }} className="mobile-header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-primary)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
            <Volume2 size={18} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--font-lg)', color: 'var(--color-text)' }}>
            EchoScribe
          </span>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isInstallable && (
            <button 
              onClick={triggerInstall}
              className="pulse"
              style={{
                backgroundColor: 'var(--color-primary)',
                border: 'none',
                color: '#FFF',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-display)'
              }}
            >
              <Download size={12} /> Install App
            </button>
          )}
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', padding: '4px' }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* App Container */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* Dim Backdrop for Mobile Drawer */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: '65px',
              left: 0,
              right: 0,
              bottom: '64px',
              backgroundColor: 'rgba(45, 52, 54, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 140,
              animation: 'fadeIn 0.25s ease'
            }}
          />
        )}

        {/* Sidebar Layout / Drawer overlay */}
        <aside 
          className={`sidebar-navigation ${mobileMenuOpen ? 'mobile-open' : ''}`}
          style={{
            width: '260px',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--color-border)',
            padding: '2.5rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            zIndex: 150,
            transition: 'transform var(--transition-normal)'
          }}
        >
          <div>
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '2.5rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 8px rgba(231, 111, 81, 0.2)'
              }}>
                <Volume2 size={22} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--font-xl)', color: 'var(--color-text)' }}>
                EchoScribe
              </span>
            </Link>

            {/* Nav List */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to) && item.to !== '/';

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleLinkClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      backgroundColor: isActive ? 'rgba(231, 111, 81, 0.08)' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--font-sm)',
                      transition: 'all var(--transition-fast)'
                    }}
                    className={({ isActive }) => isActive ? 'nav-active' : ''}
                  >
                    <Icon size={18} style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto', paddingTop: '2rem' }}>
            
            {/* Install Button (Desktop and Mobile Drawer) */}
            {isInstallable && (
              <button 
                onClick={triggerInstall}
                className="btn btn-primary flex align-center justify-center gap-2 pulse"
                style={{ 
                  width: '100%', 
                  fontSize: 'var(--font-xs)', 
                  padding: '0.65rem 1rem',
                  boxShadow: '0 4px 8px rgba(231, 111, 81, 0.2)' 
                }}
              >
                <Download size={14} />
                Install EchoScribe
              </button>
            )}

            {/* Demo Button */}
            {!demoLoaded && (
              <button 
                onClick={loadDemoData}
                className="btn btn-secondary flex align-center justify-center gap-2"
                style={{ width: '100%', fontSize: 'var(--font-xs)', padding: '0.5rem 1rem', borderStyle: 'dashed', borderColor: 'var(--color-primary)' }}
              >
                <Database size={14} />
                Load Demo Data
              </button>
            )}

            {/* Readiness Indicator */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              fontSize: 'var(--font-xs)',
              border: '1px solid var(--color-border)'
            }}>
              <div className="flex justify-between" style={{ marginBottom: '0.25rem', fontWeight: 600 }}>
                <span>Model Readiness</span>
                <span>{trainingProgress.readinessScore}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${trainingProgress.readinessScore}%`, backgroundColor: 'var(--color-accent)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '10px' }}>
                {trainingProgress.samplesCollected} samples trained
              </div>
            </div>

            {/* Accessibility badges indicator */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {accessibilitySettings.largeText && <span className="badge badge-primary" style={{ fontSize: '8px', padding: '2px 4px' }}>Large</span>}
              {accessibilitySettings.highContrast && <span className="badge badge-success" style={{ fontSize: '8px', padding: '2px 4px' }}>Contrast</span>}
              {accessibilitySettings.dyslexiaFont && <span className="badge badge-warning" style={{ fontSize: '8px', padding: '2px 4px' }}>Dyslexic</span>}
            </div>
          </div>
        </aside>

        {/* Main Body */}
        <main 
          className="main-content"
          style={{
            marginLeft: '260px',
            flex: 1,
            padding: '2.5rem',
            maxWidth: 'calc(100% - 260px)',
            backgroundColor: 'var(--bg-primary)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--color-border)',
        zIndex: 250,
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(45, 52, 54, 0.05)'
      }}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== '/';

          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                flex: 1,
                height: '100%',
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-display)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={20} style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        {/* Mobile "More" Drawer Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            color: mobileMenuOpen ? 'var(--color-primary)' : 'var(--color-text-muted)',
            flex: 1,
            height: '100%',
            fontSize: '10px',
            fontWeight: mobileMenuOpen ? 700 : 500,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span>{mobileMenuOpen ? 'Close' : 'More'}</span>
        </button>
      </nav>

      {/* Floating Quick Action Button */}
      {location.pathname !== '/transcription' && (
        <Link
          to="/transcription"
          className="floating-live-fab pulse"
          style={{
            position: 'fixed',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-full)',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 199,
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: 'var(--font-sm)',
            fontFamily: 'var(--font-display)',
            border: '2px solid #FFF'
          }}
        >
          <Mic size={18} />
          Start Live Mode
        </Link>
      )}

      {/* Floating Emergency SOS Button */}
      <button
        onClick={() => {
          if (directDialerBypass && primaryContact && primaryContact.phone) {
            navigate('/direct-call');
          } else {
            setShowEmergencyModal(true);
          }
        }}
        className="floating-sos-button"
        style={{
          position: 'fixed',
          backgroundColor: '#DC2626',
          color: '#FFFFFF',
          borderRadius: '50%',
          width: '64px',
          height: '64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7), 0 4px 16px rgba(220, 38, 38, 0.4)',
          zIndex: 999,
          border: '3px solid #FFF',
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          fontWeight: '900',
          transition: 'transform 0.15s ease'
        }}
        aria-label="Emergency SOS"
      >
        <span style={{ fontSize: '13px', letterSpacing: '0.5px', lineHeight: '1' }}>SOS</span>
        <Phone size={14} style={{ marginTop: '2px' }} />
      </button>

      {/* High-Contrast Emergency Modal Overlay (Emergency Panel) */}
      {showEmergencyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="card animate-fade-in" style={{
            width: '100%',
            maxWidth: '450px',
            backgroundColor: 'var(--bg-card)',
            border: '3px solid #DC2626',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowEmergencyModal(false)}
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
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ShieldAlert size={32} />
              </div>
              <h2 style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-display)', margin: 0, color: 'var(--color-text)' }}>
                Emergency Contacts
              </h2>
            </div>

            {primaryContact ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Primary Emergency Contact
                </div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-text)' }}>
                  {primaryContact.name}
                </div>
                <div style={{ display: 'inline-block', alignSelf: 'center', backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-xs)', fontWeight: 'bold' }}>
                  {primaryContact.relationship}
                </div>
                <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'bold', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Phone size={18} style={{ color: '#DC2626' }} />
                  {primaryContact.phone}
                </div>
                {primaryContact.notes && (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                    "{primaryContact.notes}"
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed #DC2626', marginBottom: '1.5rem', textAlign: 'center' }}>
                <AlertTriangle size={32} style={{ color: '#DC2626', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
                  No primary emergency contact found.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {primaryContact ? (
                <>
                  <button 
                    onClick={() => {
                      window.location.href = `tel:${primaryContact.phone}`;
                    }}
                    className="btn btn-primary"
                    style={{
                      backgroundColor: '#DC2626',
                      borderColor: '#DC2626',
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontSize: 'var(--font-md)',
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <Phone size={18} /> CALL NOW
                  </button>

                  <button 
                    onClick={() => handleCopyNumber(primaryContact.phone)}
                    className="btn btn-secondary"
                    style={{
                      fontWeight: 'bold',
                      fontSize: 'var(--font-sm)',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {copiedSuccess ? 'Copied!' : 'Copy Number'}
                  </button>

                  <Link
                    to="/emergency"
                    onClick={() => setShowEmergencyModal(false)}
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 'var(--font-sm)',
                      height: '50px',
                      width: '100%',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    Change Contact
                  </Link>
                </>
              ) : (
                <Link
                  to="/emergency"
                  onClick={() => setShowEmergencyModal(false)}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    height: '56px',
                    width: '100%',
                    textDecoration: 'none',
                    backgroundColor: '#DC2626',
                    borderColor: '#DC2626',
                    color: '#FFF',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  Set Up Emergency Contacts
                </Link>
              )}
              
              <button 
                onClick={() => setShowEmergencyModal(false)} 
                className="btn btn-secondary"
                style={{ height: '50px', width: '100%', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
              >
                Close Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Post-Install Encouragement Modal */}
      {showEncouragement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card animate-fade-in" style={{
            width: '100%',
            maxWidth: '450px',
            backgroundColor: 'var(--bg-card)',
            border: '3px solid var(--color-success)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(42, 157, 143, 0.1)',
              color: 'var(--color-success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
            </div>
            
            <h2 style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--color-text)' }}>
              EchoScribe Installed!
            </h2>
            
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              To ensure instant emergency calling under stress, we recommend placing EchoScribe on your **Home Screen**. 
              Once added, you can also long-press the icon to drag the direct **Emergency** shortcut onto your home screen for one-tap safety access.
            </p>
            
            <button 
              onClick={() => {
                setShowEncouragement(false);
                localStorage.removeItem('echoscribe_just_installed');
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '50px',
                fontWeight: 'bold',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success)',
                borderColor: 'var(--color-success)'
              }}
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* Inject styling rules for mobile responsiveness directly */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse-sos {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6), 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(220, 38, 38, 0), 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 4px 12px rgba(220, 38, 38, 0.3);
          }
        }
        .floating-live-fab {
          bottom: 24px;
          left: 284px;
        }
        .floating-sos-button {
          position: fixed;
          bottom: 24px;
          right: 24px;
          animation: pulse-sos 2s infinite;
        }
        .floating-sos-button:active {
          transform: scale(0.92);
        }
        @media (max-width: 1024px) {
          .floating-live-fab {
            bottom: 80px !important;
            left: 16px !important;
          }
          .floating-sos-button {
            bottom: 80px !important;
            right: 16px !important;
          }
          .mobile-header {
            display: flex !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
          .sidebar-navigation {
            transform: translateX(-100%);
            height: calc(100vh - 129px) !important;
            top: 65px !important;
            width: 100% !important;
            max-width: 320px;
            box-shadow: var(--shadow-lg);
          }
          .sidebar-navigation.mobile-open {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0 !important;
            max-width: 100% !important;
            padding: 1.5rem 1rem 5.5rem 1rem !important; /* Bottom padding for bottom navigation */
          }
        }
      `}</style>
    </div>
  );
};
