import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Toggle } from '../components/Toggle';
import {
  Phone,
  ShieldAlert,
  X,
  Volume2,
  Check,
  AlertTriangle,
  UserPlus,
  Trash2,
  Edit,
  CheckCircle,
  Copy,
  Info,
  ArrowLeft,
  Settings,
  Heart,
  HelpCircle
} from 'lucide-react';

const COUNTRY_CODES = {
  IN: { name: "India", code: "+91", pattern: /^[6-9]\d{9}$/, placeholder: "9876543210 (10 digits)" },
  US: { name: "United States", code: "+1", pattern: /^\d{10}$/, placeholder: "2025550199 (10 digits)" },
  GB: { name: "United Kingdom", code: "+44", pattern: /^7\d{9}$|^\d{10}$/, placeholder: "7911123456 (10 digits)" },
  CA: { name: "Canada", code: "+1", pattern: /^\d{10}$/, placeholder: "4165550199 (10 digits)" },
  AU: { name: "Australia", code: "+61", pattern: /^4\d{8}$|^\d{9}$/, placeholder: "412345678 (9 digits)" }
};

export const Emergency = () => {
  const { isInstallable, triggerInstall } = useApp();

  // Contact list state
  const [contacts, setContacts] = useState([]);
  const [primaryContactId, setPrimaryContactId] = useState('');
  const [showManageContacts, setShowManageContacts] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // Toggles for detail view and secondary tactile panel
  const [showDetails, setShowDetails] = useState(false);
  const [showTactileAlerts, setShowTactileAlerts] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRelationship, setFormRelationship] = useState('');
  const [formCountry, setFormCountry] = useState('IN');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  
  // UI states
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [alertSent, setAlertSent] = useState(false);

  const [directDialerBypass, setDirectDialerBypass] = useState(() => {
    return localStorage.getItem('echoscribe_direct_dial_bypass') === 'true';
  });

  // Load contacts from LocalStorage on mount
  useEffect(() => {
    const storedContacts = localStorage.getItem('emergencyContacts');
    const storedPrimary = localStorage.getItem('primaryEmergencyContactId');
    if (storedContacts) {
      const parsed = JSON.parse(storedContacts);
      setContacts(parsed);
      if (storedPrimary) {
        setPrimaryContactId(storedPrimary);
      } else if (parsed.length > 0) {
        setPrimaryContactId(parsed[0].id);
        localStorage.setItem('primaryEmergencyContactId', parsed[0].id);
      }
    }
  }, []);

  // Alert sequence timer
  useEffect(() => {
    let timer;
    if (activeAlert && countdown > 0 && !alertSent) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (activeAlert && countdown === 0 && !alertSent) {
      triggerBroadcast();
    }
    return () => clearTimeout(timer);
  }, [activeAlert, countdown, alertSent]);

  // Sync settings with LocalStorage and Cache
  useEffect(() => {
    localStorage.setItem('echoscribe_direct_dial_bypass', String(directDialerBypass));
    window.dispatchEvent(new Event('emergency-settings-updated'));
    if ('caches' in window) {
      caches.open('echoscribe-contacts').then((cache) => {
        cache.put('/api/direct-dial-bypass', new Response(String(directDialerBypass)));
        if (primaryContact && primaryContact.phone) {
          cache.put('/api/primary-phone', new Response(primaryContact.phone));
        }
      }).catch((err) => console.warn('Cache write failed:', err));
    }
  }, [directDialerBypass, primaryContactId, contacts]);

  const speakText = (text) => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      synth.speak(utterance);
    }
  };

  const handleTriggerAlert = (action) => {
    speakText(`Initiating countdown for: ${action.title}`);
    setActiveAlert(action);
    setCountdown(5);
    setAlertSent(false);
  };

  const triggerBroadcast = () => {
    setAlertSent(true);
    speakText(`${activeAlert.speechText}. Location coordinates broadcasted.`);
    
    // Automatically trigger dialer for primary contact on broadcast completion if family option
    const primary = contacts.find(c => c.id === primaryContactId);
    if (primary && activeAlert.id === 'em_family') {
      triggerPhoneCall(primary.phone);
    }
  };

  const handleCancelAlert = () => {
    speakText('Emergency alert cancelled.');
    setActiveAlert(null);
    setCountdown(5);
    setAlertSent(false);
  };

  const triggerPhoneCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number)
      .then(() => {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2000);
      });
  };

  const notifyContactsUpdate = () => {
    window.dispatchEvent(new Event('emergency-contacts-updated'));
  };

  // Save Contact Handler
  const handleSaveContact = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!formRelationship.trim()) {
      setFormError('Relationship is required.');
      return;
    }
    if (!formPhone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    const config = COUNTRY_CODES[formCountry];
    let cleaned = formPhone.replace(/\D/g, '');
    const codeDigits = config.code.replace(/\D/g, '');
    if (cleaned.startsWith(codeDigits) && cleaned.length === (codeDigits.length + config.placeholder.replace(/\D/g, '').length)) {
      cleaned = cleaned.slice(codeDigits.length);
    }

    if (!config.pattern.test(cleaned)) {
      setFormError(`Invalid format for ${config.name}. Expected format: ${config.placeholder}`);
      return;
    }

    const formattedPhone = `${config.code}${cleaned}`;

    let updatedContacts;
    if (editingContact) {
      updatedContacts = contacts.map(c => c.id === editingContact.id ? {
        ...c,
        name: formName.trim(),
        phone: formattedPhone,
        localPhone: cleaned,
        relationship: formRelationship.trim(),
        country: formCountry,
        notes: formNotes.trim()
      } : c);
    } else {
      const newContact = {
        id: 'contact_' + Date.now(),
        name: formName.trim(),
        phone: formattedPhone,
        localPhone: cleaned,
        relationship: formRelationship.trim(),
        country: formCountry,
        notes: formNotes.trim()
      };
      updatedContacts = [...contacts, newContact];
    }

    localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
    setContacts(updatedContacts);

    // If it's the first contact, make it primary
    if (updatedContacts.length === 1 || (!primaryContactId && !editingContact)) {
      localStorage.setItem('primaryEmergencyContactId', updatedContacts[0].id);
      setPrimaryContactId(updatedContacts[0].id);
    }

    // Reset Form
    setIsAdding(false);
    setEditingContact(null);
    setFormName('');
    setFormPhone('');
    setFormRelationship('');
    setFormCountry('IN');
    setFormNotes('');
    
    notifyContactsUpdate();
  };

  const handleEditContactClick = (contact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormPhone(contact.localPhone || contact.phone.replace(COUNTRY_CODES[contact.country].code, ''));
    setFormRelationship(contact.relationship);
    setFormCountry(contact.country);
    setFormNotes(contact.notes || '');
    setIsAdding(true);
  };

  const handleDeleteContact = (contactId) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
    setContacts(updatedContacts);

    if (primaryContactId === contactId) {
      if (updatedContacts.length > 0) {
        localStorage.setItem('primaryEmergencyContactId', updatedContacts[0].id);
        setPrimaryContactId(updatedContacts[0].id);
      } else {
        localStorage.removeItem('primaryEmergencyContactId');
        setPrimaryContactId('');
      }
    }
    notifyContactsUpdate();
  };

  const handleSetPrimary = (contactId) => {
    localStorage.setItem('primaryEmergencyContactId', contactId);
    setPrimaryContactId(contactId);
    notifyContactsUpdate();
    speakText('Primary contact updated.');
  };

  const primaryContact = contacts.find(c => c.id === primaryContactId);

  const EMERGENCY_ACTIONS = [
    {
      id: 'em_medical',
      title: 'Medical Help',
      subtitle: 'Alert ambulance and doctor',
      speechText: 'Emergency: I require immediate medical help.',
      icon: Heart,
      color: '#DC2626',
      bgColor: 'rgba(220, 38, 38, 0.1)'
    },
    {
      id: 'em_family',
      title: 'Call Family',
      subtitle: 'Notify primary caregivers',
      speechText: 'Emergency: Please contact my family immediately.',
      icon: Phone,
      color: '#2A9D8F',
      bgColor: 'rgba(42, 157, 143, 0.1)'
    },
    {
      id: 'em_assistance',
      title: 'Need Assistance',
      subtitle: 'Ask for physical support',
      speechText: 'Attention: I need physical assistance in this room.',
      icon: HelpCircle,
      color: '#F4A261',
      bgColor: 'rgba(244, 162, 97, 0.1)'
    },
    {
      id: 'em_contacts',
      title: 'Emergency Contacts',
      subtitle: 'Broadcast GPS coordinates',
      speechText: 'Attention: Broadcasting my current location to emergency contacts.',
      icon: ShieldAlert,
      color: '#E76F51',
      bgColor: 'rgba(231, 111, 81, 0.1)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* QUICK EMERGENCY SCREEN (DEFAULT) */}
      {!showManageContacts && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <ShieldAlert size={36} />
            </div>
            <h1 style={{ fontSize: 'var(--font-3xl)', fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Emergency Safety Hub
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', margin: 0 }}>
              Instantly contact primary care and open system dialer.
            </p>
          </div>

          {primaryContact ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* BUTTON 1: CALL PRIMARY CONTACT (GIANT BUTTON) */}
              <button
                onClick={() => triggerPhoneCall(primaryContact.phone)}
                className="btn pulse-call"
                style={{
                  width: '100%',
                  height: '110px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(220, 38, 38, 0.3)',
                  transition: 'transform 0.1s ease',
                  padding: '1.5rem',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone size={32} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.95, letterSpacing: '0.5px' }}>
                    Call Primary Contact
                  </span>
                  <span style={{ fontSize: 'var(--font-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: '1.2', marginTop: '2px' }}>
                    {primaryContact.name}
                  </span>
                  <span style={{ fontSize: 'var(--font-sm)', opacity: 0.9, marginTop: '2px' }}>
                    {primaryContact.phone}
                  </span>
                </div>
              </button>

              {/* BUTTON 2: VIEW CONTACT DETAILS (ACCORDION / PANEL TOGGLE) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    height: '60px',
                    fontSize: 'var(--font-md)',
                    fontWeight: 'bold',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '2px solid var(--color-border)'
                  }}
                >
                  <Info size={20} />
                  {showDetails ? 'Hide Contact Info' : 'View Contact Info'}
                </button>

                {showDetails && (
                  <div className="card animate-fade-in" style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}>
                    <div className="grid grid-2 gap-4">
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Relationship</span>
                        <span style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>{primaryContact.relationship}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Country</span>
                        <span style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>{COUNTRY_CODES[primaryContact.country]?.name || primaryContact.country}</span>
                      </div>
                    </div>
                    {primaryContact.notes && (
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Medical / Helper Notes</span>
                        <p style={{ fontSize: 'var(--font-sm)', margin: '4px 0 0 0', color: 'var(--color-text)', lineHeight: '1.4' }}>{primaryContact.notes}</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleCopyNumber(primaryContact.phone)}
                        className="btn btn-secondary flex align-center justify-center gap-1"
                        style={{ fontSize: 'var(--font-xs)', padding: '8px 12px', flex: 1, backgroundColor: 'var(--bg-card)' }}
                      >
                        {copiedSuccess ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                        {copiedSuccess ? 'Copied!' : 'Copy Phone Number'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BUTTON 3: CHANGE CONTACT */}
              <button
                onClick={() => setShowManageContacts(true)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  height: '60px',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--color-border)'
                }}
              >
                <Settings size={20} />
                Change Contact
              </button>

            </div>
          ) : (
            <div className="card" style={{ borderLeft: '4px solid #DC2626', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
              <AlertTriangle size={48} style={{ color: '#DC2626', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
                No Emergency Contact Configured
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', marginBottom: '1.5rem' }}>
                You must add at least one emergency contact to enable emergency calling features.
              </p>
              
              <button 
                onClick={() => {
                  setShowManageContacts(true);
                  setIsAdding(true);
                }} 
                className="btn btn-primary flex align-center justify-center gap-2"
                style={{ margin: '0 auto', padding: '1rem 2rem', fontSize: 'var(--font-md)', fontWeight: 'bold', backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                <UserPlus size={20} /> Set Up Emergency Contacts
              </button>
            </div>
          )}

          {/* SECONDARY TACTILE ALERTS TOGGLE FOR SPEECH OUTS */}
          {primaryContact && (
            <div style={{ marginTop: '0.5rem' }}>
              <button 
                onClick={() => setShowTactileAlerts(!showTactileAlerts)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  fontSize: 'var(--font-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                {showTactileAlerts ? 'Hide Speech Alerts' : 'Show Tactile Speech Alerts'}
              </button>

              {showTactileAlerts && (
                <div className="card animate-fade-in" style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
                  
                  {activeAlert && (
                    <div style={{
                      backgroundColor: alertSent ? 'rgba(42, 157, 143, 0.05)' : 'rgba(220, 38, 38, 0.05)',
                      border: `2px solid ${alertSent ? 'var(--color-success)' : '#DC2626'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      {alertSent ? (
                        <>
                          <div style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: 'var(--font-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <CheckCircle size={18} /> SPEECH ALERT BROADCASTED
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 8px 0' }}>
                            "{activeAlert.speechText}"
                          </p>
                          <button onClick={handleCancelAlert} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '10px' }}>Reset</button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-sm)' }}>Broadcasting alert in:</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#DC2626', margin: '4px 0' }} className="pulse-call">{countdown}</div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button onClick={triggerBroadcast} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '10px', backgroundColor: '#DC2626', borderColor: '#DC2626' }}>Send Now</button>
                            <button onClick={handleCancelAlert} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '10px' }}>Cancel</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid grid-2 gap-2">
                    {EMERGENCY_ACTIONS.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleTriggerAlert(action)}
                          style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <Icon size={20} style={{ color: action.color }} />
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{action.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EMERGENCY WIDGET SETTINGS */}
          {primaryContact && (
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 'bold', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0 0 0.5rem 0' }}>
                <Settings size={16} style={{ color: 'var(--color-primary)' }} />
                Emergency Widget Behavior
              </h3>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: '0 0 0.5rem 0' }}>
                Configure the action when tapping on emergency widgets (such as the Floating SOS button or the Dashboard SOS widget).
              </p>
              
              <Toggle 
                id="direct-dial-toggle"
                checked={directDialerBypass}
                onChange={setDirectDialerBypass}
                label="Direct Phone Dialer"
                description="Bypass in-app confirmation screens and launch the device's native dialer directly with your primary contact."
              />
            </div>
          )}

          {/* INSTALLATION & SHORTCUT INSTRUCTIONS */}
          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 'bold', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0 0 0.5rem 0' }}>
              <Info size={16} style={{ color: 'var(--color-primary)' }} />
              Home Screen Shortcut Support
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
              EchoScribe supports deep-link shortcuts. After installing the app, you can add an <strong>Emergency Link</strong> directly to your device home screen which opens your dialer directly.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isInstallable && (
                <button
                  onClick={triggerInstall}
                  className="btn btn-primary pulse-call"
                  style={{
                    width: '100%',
                    height: '45px',
                    fontWeight: 'bold',
                    fontSize: 'var(--font-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    backgroundColor: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)'
                  }}
                >
                  Install EchoScribe PWA
                </button>
              )}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                lineHeight: '1.4'
              }}>
                <strong>How to add:</strong> Long-press the EchoScribe app icon on your home screen and drag the <strong>"Emergency"</strong> option onto your home screen. When tapped, it immediately launches your device dialer.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT MANAGEMENT SCREEN (TOGGLED) */}
      {showManageContacts && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setShowManageContacts(false);
                setIsAdding(false);
                setEditingContact(null);
                setFormError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                color: 'var(--color-text)'
              }}
              title="Back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0 }}>
              Manage Contacts
            </h1>
          </div>

          {/* ADD/EDIT CONTACT FORM OVERLAY */}
          {isAdding && (
            <div className="card" style={{ padding: '1.5rem', border: '2px solid var(--color-primary)' }}>
              <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserPlus size={18} style={{ color: 'var(--color-primary)' }} />
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </h2>
              
              <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formError && (
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 'bold' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Name *</label>
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. John Doe"
                      style={{ width: '100%', padding: '0.6rem', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Relationship *</label>
                    <input 
                      type="text" 
                      value={formRelationship}
                      onChange={(e) => setFormRelationship(e.target.value)}
                      placeholder="e.g. Spouse, Brother, Doctor"
                      style={{ width: '100%', padding: '0.6rem', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                      required
                    />
                  </div>

                  <div className="grid grid-2 gap-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Country *</label>
                      <select 
                        value={formCountry}
                        onChange={(e) => setFormCountry(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--bg-card)' }}
                      >
                        {Object.entries(COUNTRY_CODES).map(([key, data]) => (
                          <option key={key} value={key}>{data.name} ({data.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Phone Number *</label>
                      <input 
                        type="tel" 
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder={COUNTRY_CODES[formCountry].placeholder}
                        style={{ width: '100%', padding: '0.6rem', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Optional Notes</label>
                    <textarea 
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Medical conditions, address, special directions..."
                      rows="2"
                      style={{ width: '100%', padding: '0.6rem', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.6rem' }}>Save</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAdding(false);
                      setEditingContact(null);
                      setFormError('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.6rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CONTACTS LIST */}
          {!isAdding && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {contacts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No emergency contacts configured yet.
                </div>
              ) : (
                contacts.map((contact) => {
                  const isPrimary = contact.id === primaryContactId;
                  return (
                    <div 
                      key={contact.id} 
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isPrimary ? '2px solid #DC2626' : '1px solid var(--color-border)',
                        backgroundColor: isPrimary ? 'rgba(220, 38, 38, 0.02)' : 'var(--bg-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', fontSize: 'var(--font-md)' }}>{contact.name}</span>
                            <span className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 6px', textTransform: 'capitalize' }}>
                              {contact.relationship}
                            </span>
                            {isPrimary && (
                              <span className="badge" style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: '#DC2626', color: '#FFF' }}>
                                Primary
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {contact.phone} ({COUNTRY_CODES[contact.country]?.name || contact.country})
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            onClick={() => handleEditContactClick(contact)} 
                            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteContact(contact.id)} 
                            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {contact.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Notes: {contact.notes}
                        </div>
                      )}

                      {!isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(contact.id)}
                          className="btn btn-secondary"
                          style={{
                            alignSelf: 'flex-start',
                            fontSize: '11px',
                            padding: '4px 8px',
                            marginTop: '0.25rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          Set as Primary
                        </button>
                      )}
                    </div>
                  );
                })
              )}

              <button
                onClick={() => setIsAdding(true)}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '50px',
                  marginTop: '0.5rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  backgroundColor: '#DC2626',
                  borderColor: '#DC2626'
                }}
              >
                <UserPlus size={18} />
                Add Contact
              </button>

              <button
                onClick={() => {
                  setShowManageContacts(false);
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  height: '50px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Back to Emergency Actions
              </button>
            </div>
          )}

        </div>
      )}

      {/* Embedded Animations Styling */}
      <style>{`
        @keyframes pulse-call-btn {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5), 0 6px 20px rgba(220, 38, 38, 0.2);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0), 0 6px 20px rgba(220, 38, 38, 0.2);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 6px 20px rgba(220, 38, 38, 0.2);
          }
        }
        .pulse-call {
          animation: pulse-call-btn 2s infinite;
        }
        .pulse-call:active {
          transform: scale(0.97);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
};
