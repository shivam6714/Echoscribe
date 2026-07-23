import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const DEFAULT_SETTINGS = {
  largeText: false,
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
  keyboardNavigation: true
};

const DEFAULT_TRAINING = {
  samplesCollected: 0,
  confidenceEstimate: 0,
  readinessScore: 0,
  completedPhrases: []
};

const DEFAULT_REHAB = {
  exercisesCompleted: 0,
  clarityScore: 0,
  consistency: 0,
  streak: 0,
  lastPractice: null,
  history: []
};

const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_training', title: 'First Training Complete', desc: 'Recorded your first custom speech translation.', unlocked: false },
  { id: 'accuracy_90', title: '90% Accuracy Achieved', desc: 'Achieved high clarity on a speech transcription.', unlocked: false },
  { id: 'rehab_streak', title: 'One Week Streak', desc: 'Practiced rehabilitation exercises for 7 consecutive days.', unlocked: false },
  { id: 'custom_dict', title: 'Personalized Vocabulary', desc: 'Added your first word to the custom dictionary.', unlocked: false }
];

export const AppProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('PWA Install Prompt outcome:', outcome);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('echoscribe_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(item => !item.id || !item.id.includes('demo')) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [customDictionary, setCustomDictionary] = useState(() => {
    const saved = localStorage.getItem('echoscribe_dictionary');
    return saved ? JSON.parse(saved) : {};
  });

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('echoscribe_favorites');
    return saved ? JSON.parse(saved) : [
      "I need support", 
      "Open YouTube", 
      "Call Mom", 
      "Please help me"
    ];
  });

  const [accessibilitySettings, setAccessibilitySettings] = useState(() => {
    const saved = localStorage.getItem('echoscribe_accessibility');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [trainingProgress, setTrainingProgress] = useState(() => {
    const saved = localStorage.getItem('echoscribe_training');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.samplesCollected === 24) return DEFAULT_TRAINING; // purge legacy demo state
        return parsed;
      } catch (e) {
        return DEFAULT_TRAINING;
      }
    }
    return DEFAULT_TRAINING;
  });

  const [rehabStats, setRehabStats] = useState(() => {
    const saved = localStorage.getItem('echoscribe_rehab');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.exercisesCompleted === 14) return DEFAULT_REHAB; // purge legacy demo state
        return parsed;
      } catch (e) {
        return DEFAULT_REHAB;
      }
    }
    return DEFAULT_REHAB;
  });

  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('echoscribe_achievements');
    return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
  });

  // Syncs to localStorage
  useEffect(() => {
    localStorage.setItem('echoscribe_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('echoscribe_dictionary', JSON.stringify(customDictionary));
  }, [customDictionary]);

  useEffect(() => {
    localStorage.setItem('echoscribe_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('echoscribe_accessibility', JSON.stringify(accessibilitySettings));
  }, [accessibilitySettings]);

  useEffect(() => {
    localStorage.setItem('echoscribe_training', JSON.stringify(trainingProgress));
  }, [trainingProgress]);

  useEffect(() => {
    localStorage.setItem('echoscribe_rehab', JSON.stringify(rehabStats));
  }, [rehabStats]);

  useEffect(() => {
    localStorage.setItem('echoscribe_achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Apply accessibility settings directly to body root
  useEffect(() => {
    const root = document.documentElement;
    if (accessibilitySettings.largeText) root.classList.add('large-text');
    else root.classList.remove('large-text');

    if (accessibilitySettings.highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');

    if (accessibilitySettings.dyslexiaFont) root.classList.add('dyslexia-font');
    else root.classList.remove('dyslexia-font');

    if (accessibilitySettings.reducedMotion) root.classList.add('reduced-motion');
    else root.classList.remove('reduced-motion');
  }, [accessibilitySettings]);

  // Actions
  const addTranscription = (original, corrected, confidence, method) => {
    const newItem = {
      id: 'tx_' + Date.now() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      original,
      corrected,
      confidence,
      method,
      saved: true
    };
    setHistory(prev => [newItem, ...prev]);

    if (confidence >= 90) {
      unlockAchievement('accuracy_90');
    }
  };

  const deleteTranscription = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const addCustomWord = (phrase, correction) => {
    setCustomDictionary(prev => ({
      ...prev,
      [phrase.trim().toLowerCase()]: correction.trim()
    }));
    unlockAchievement('custom_dict');
  };

  const deleteCustomWord = (phrase) => {
    setCustomDictionary(prev => {
      const updated = { ...prev };
      delete updated[phrase.trim().toLowerCase()];
      return updated;
    });
  };

  const toggleFavoritePhrase = (phrase) => {
    setFavorites(prev => {
      if (prev.includes(phrase)) {
        return prev.filter(p => p !== phrase);
      } else {
        return [...prev, phrase];
      }
    });
  };

  const updateAccessibilitySetting = (setting, value) => {
    setAccessibilitySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const recordTrainingSample = (phrase, textInput) => {
    setTrainingProgress(prev => {
      const isNew = !prev.completedPhrases.includes(phrase);
      const updatedPhrases = isNew ? [...prev.completedPhrases, phrase] : prev.completedPhrases;
      const count = updatedPhrases.length;
      const confidenceEst = Math.min(100, Math.round((count / 12) * 100));
      const readiness = Math.min(100, Math.round((count / 12) * 100));
      
      return {
        samplesCollected: prev.samplesCollected + 1,
        confidenceEstimate: confidenceEst,
        readinessScore: readiness,
        completedPhrases: updatedPhrases
      };
    });

    unlockAchievement('first_training');
  };

  const completeDailyExercise = (exerciseName, score) => {
    setRehabStats(prev => {
      const today = new Date().toDateString();
      const lastPracticeDay = prev.lastPractice ? new Date(prev.lastPractice).toDateString() : null;
      
      let newStreak = prev.streak;
      if (lastPracticeDay === null) {
        newStreak = 1;
      } else if (today !== lastPracticeDay) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (yesterday.toDateString() === lastPracticeDay) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      if (newStreak >= 7) {
        unlockAchievement('rehab_streak');
      }

      const totalExercises = prev.exercisesCompleted + 1;
      const newClarity = Math.round((prev.clarityScore * prev.exercisesCompleted + score) / totalExercises);
      const newConsistency = Math.round(Math.min(100, prev.consistency + 2));

      return {
        exercisesCompleted: totalExercises,
        clarityScore: Math.min(100, Math.max(0, newClarity)),
        consistency: newConsistency,
        streak: newStreak,
        lastPractice: new Date().toISOString(),
        history: [{ date: new Date().toISOString(), score, exerciseName }, ...prev.history].slice(0, 15)
      };
    });
  };

  const unlockAchievement = (id) => {
    setAchievements(prev => 
      prev.map(ach => ach.id === id ? { ...ach, unlocked: true } : ach)
    );
  };

  const resetAllData = () => {
    localStorage.removeItem('echoscribe_history');
    localStorage.removeItem('echoscribe_dictionary');
    localStorage.removeItem('echoscribe_favorites');
    localStorage.removeItem('echoscribe_accessibility');
    localStorage.removeItem('echoscribe_training');
    localStorage.removeItem('echoscribe_rehab');
    localStorage.removeItem('echoscribe_achievements');

    setHistory([]);
    setCustomDictionary({});
    setFavorites(["I need support", "Open YouTube", "Call Mom", "Please help me"]);
    setAccessibilitySettings(DEFAULT_SETTINGS);
    setTrainingProgress(DEFAULT_TRAINING);
    setRehabStats(DEFAULT_REHAB);
    setAchievements(prev => prev.map(ach => ({ ...ach, unlocked: false })));
  };

  const value = {
    history,
    customDictionary,
    favorites,
    accessibilitySettings,
    trainingProgress,
    rehabStats,
    achievements,
    isInstallable,
    triggerInstall,
    addTranscription,
    deleteTranscription,
    clearHistory,
    addCustomWord,
    deleteCustomWord,
    toggleFavoritePhrase,
    updateAccessibilitySetting,
    recordTrainingSample,
    completeDailyExercise,
    resetAllData,
    unlockAchievement
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
