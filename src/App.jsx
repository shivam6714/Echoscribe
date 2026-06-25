import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { TrainingPage } from './pages/TrainingPage';
import { LiveTranscription } from './pages/LiveTranscription';
import { Rehabilitation } from './pages/Rehabilitation';
import { Analytics } from './pages/Analytics';
import { History } from './pages/History';
import { Accessibility } from './pages/Accessibility';
import { Emergency } from './pages/Emergency';
import { DirectCall } from './pages/DirectCall';
import { SpeechTestPage } from './pages/SpeechTestPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/transcription" element={<LiveTranscription />} />
              <Route path="/rehab" element={<Rehabilitation />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/history" element={<History />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/direct-call" element={<DirectCall />} />
              <Route path="/speech-test" element={<SpeechTestPage />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
