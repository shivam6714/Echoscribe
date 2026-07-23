/**
 * EchoScribe AI Speech Engine Simulator
 * Handles fuzzy matching, phonetic similarity mapping, confidence scoring,
 * training simulation, and analytics generation.
 */

// Default speech mapping dictionary
export const DEFAULT_DICTIONARY = {
  "hlp me": "Help me",
  "cl mom": "Call Mom",
  "opn gmail": "Open Gmail",
  "yt musc": "YouTube Music",
  "opl yutub": "Open YouTube",
  "hlo": "Hello",
  "thnk u": "Thank you",
  "nd wtr": "Need water",
  "go out": "Go outside",
  "tly v": "Turn on TV",
  "lghts": "Turn on lights",
  "ggl": "Google",
  "plz hlp": "Please help",
  "col dad": "Call Dad",
  "meds": "Take medicine",
  "hungry": "I am hungry",
  "slp": "I want to sleep",
  "bath": "Need to use restroom",
  "thnk": "Thank you",
  "yes": "Yes",
  "no": "No"
};

// Calculate Levenshtein Distance between two strings
export function calculateLevenshtein(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function stripVowels(str) {
  return str.toLowerCase().replace(/[aeiou\s]/g, '');
}

/**
 * Cleans stuttering from raw input
 */
export function cleanStutter(input) {
  if (!input || typeof input !== 'string') return "";
  
  return input.split(/\s+/).map(word => {
    if (word.includes('-')) {
      const parts = word.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart.length > 0) {
        const isStutter = parts.slice(0, -1).every(part => {
          const cleanPart = part.toLowerCase();
          return cleanPart.length > 0 && (
            lastPart.toLowerCase().startsWith(cleanPart) || 
            (cleanPart.length === 1 && lastPart.toLowerCase().startsWith(cleanPart[0]))
          );
        });
        if (isStutter) {
          const firstCharIsUpper = word[0] === word[0].toUpperCase() && /[a-zA-Z]/.test(word[0]);
          if (firstCharIsUpper) {
            return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
          }
          return lastPart;
        }
      }
    }
    return word;
  }).join(' ');
}

/**
 * Predicts the corrected version of the input phrase
 */
export function predictCorrection(input, customDictionary = {}) {
  if (!input || typeof input !== 'string') {
    return { original: '', corrected: '', confidence: 0, method: 'none' };
  }

  const stutterCleaned = cleanStutter(input);
  const cleanInput = stutterCleaned.trim().toLowerCase();
  const hadStutter = stutterCleaned.toLowerCase().trim() !== input.toLowerCase().trim();

  const fullDictionary = { ...DEFAULT_DICTIONARY, ...customDictionary };

  if (fullDictionary[cleanInput]) {
    return {
      original: input,
      corrected: fullDictionary[cleanInput],
      confidence: 98,
      method: hadStutter ? 'stutter_filter' : 'exact'
    };
  }

  const inputConsonants = stripVowels(cleanInput);
  for (const [key, value] of Object.entries(fullDictionary)) {
    const keyConsonants = stripVowels(key);
    if (inputConsonants === keyConsonants && inputConsonants.length > 1) {
      return {
        original: input,
        corrected: value,
        confidence: Math.round(90 - (calculateLevenshtein(cleanInput, key) * 2)),
        method: hadStutter ? 'stutter_filter' : 'phonetic'
      };
    }
  }

  let bestMatchKey = null;
  let minDistance = Infinity;

  for (const key of Object.keys(fullDictionary)) {
    const distance = calculateLevenshtein(cleanInput, key);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatchKey = key;
    }
  }

  const maxLen = Math.max(cleanInput.length, bestMatchKey ? bestMatchKey.length : 1);
  const similarity = 1 - minDistance / maxLen;

  if (bestMatchKey && similarity > 0.45) {
    const confidence = Math.round(similarity * 100);
    return {
      original: input,
      corrected: fullDictionary[bestMatchKey],
      confidence: Math.max(30, Math.min(95, confidence)),
      method: hadStutter ? 'stutter_filter' : 'fuzzy'
    };
  }

  if (hadStutter) {
    const fallbackText = stutterCleaned.charAt(0).toUpperCase() + stutterCleaned.slice(1);
    return {
      original: input,
      corrected: fallbackText,
      confidence: 95,
      method: 'stutter_filter'
    };
  }

  const fallbackText = input.charAt(0).toUpperCase() + input.slice(1);
  return {
    original: input,
    corrected: fallbackText,
    confidence: 45,
    method: 'fallback'
  };
}

/**
 * Simulates model training on a new speech sample
 */
export function trainModel(phrase, correction) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cleanPhrase = phrase.trim().toLowerCase();
      const cleanCorrection = correction.trim();
      
      const levDistance = calculateLevenshtein(cleanPhrase, cleanCorrection);
      const complexityScore = Math.min(100, Math.round((cleanPhrase.length / 3) * 30));
      
      resolve({
        success: true,
        phrase: cleanPhrase,
        correction: cleanCorrection,
        qualityScore: Math.round(100 - (levDistance * 10)),
        complexity: complexityScore,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  });
}

/**
 * Generates speech pattern insights strictly from user's actual activity and history.
 */
export function generateInsights(history = [], trainingProgress = {}, rehabStats = {}) {
  const readinessScore = trainingProgress.readinessScore || 0;
  const clarityScore = rehabStats.clarityScore || 0;
  const streak = rehabStats.streak || 0;
  const completedCount = trainingProgress.completedPhrases ? trainingProgress.completedPhrases.length : 0;
  const targetPhrases = 12;
  const phrasesLeft = Math.max(0, targetPhrases - completedCount);

  if (history.length === 0 && (rehabStats.exercisesCompleted || 0) === 0) {
    return {
      totalTranscriptions: 0,
      averageConfidence: 0,
      commonCorrections: [],
      successRate: 0,
      improvementScore: 0,
      insightsList: [
        { type: 'primary', text: 'No live transcription sessions recorded yet. Perform live translations to start generating real-time analytics.' },
        { type: 'accent', text: `Training progress: ${completedCount} of ${targetPhrases} target phrases completed (${readinessScore}% readiness).` },
        { type: 'warning', text: streak > 0 ? `Current practice streak: ${streak} day(s).` : 'Complete rehabilitation exercises to establish a practice streak.' }
      ]
    };
  }

  const total = history.length;
  const avgConf = total > 0 
    ? Math.round(history.reduce((sum, h) => sum + (h.confidence || 0), 0) / total)
    : clarityScore;
  
  // Find common corrections
  const frequencyMap = {};
  history.forEach(item => {
    if (item.corrected) {
      frequencyMap[item.corrected] = (frequencyMap[item.corrected] || 0) + 1;
    }
  });

  const commonCorrections = Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([phrase, count]) => ({ phrase, count }));

  const successCount = history.filter(h => (h.confidence || 0) >= 70 || h.saved).length;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : (clarityScore > 0 ? clarityScore : 0);

  const firstHalf = history.slice(0, Math.ceil(total / 2));
  const secondHalf = history.slice(Math.ceil(total / 2));
  
  let improvementScore = avgConf > 0 ? avgConf : clarityScore;
  if (firstHalf.length && secondHalf.length) {
    const avgFirst = firstHalf.reduce((sum, h) => sum + (h.confidence || 0), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, h) => sum + (h.confidence || 0), 0) / secondHalf.length;
    const diff = avgSecond - avgFirst;
    improvementScore = Math.max(0, Math.min(100, Math.round(improvementScore + diff * 1.5)));
  }

  const mostUsedPhrase = commonCorrections[0] ? commonCorrections[0].phrase : null;

  const insightsList = [
    {
      type: 'accent',
      text: mostUsedPhrase 
        ? `Speech clarity reached ${clarityScore}% with frequent usage of "${mostUsedPhrase}".`
        : clarityScore > 0 ? `Speech clarity score is currently at ${clarityScore}%.` : 'Complete daily exercises to compute clarity score.'
    },
    {
      type: 'primary',
      text: total > 0 
        ? `Adaptive matching resolved ${successRate}% of speech translations accurately.`
        : 'Start live speech sessions to profile translation accuracy.'
    },
    {
      type: 'warning',
      text: phrasesLeft > 0
        ? `Model readiness is at ${readinessScore}%. Train ${phrasesLeft} more command(s) to maximize accuracy.`
        : `All ${targetPhrases} target voice templates trained.`
    }
  ];

  return {
    totalTranscriptions: total,
    averageConfidence: avgConf,
    commonCorrections,
    successRate,
    improvementScore,
    insightsList
  };
}

/**
 * Generates dynamic time-series datasets strictly from actual user history and rehab logs.
 */
export function generateUserTimeframeData(history = [], rehabStats = {}, timeframe = 'weekly') {
  if (timeframe === 'daily') {
    const hours = ['9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
    const counts = [0, 0, 0, 0, 0];
    const accSums = [0, 0, 0, 0, 0];
    const accCounts = [0, 0, 0, 0, 0];

    history.forEach(item => {
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        const hour = date.getHours();
        let idx = 0;
        if (hour < 11) idx = 0;
        else if (hour < 14) idx = 1;
        else if (hour < 17) idx = 2;
        else if (hour < 20) idx = 3;
        else idx = 4;

        counts[idx] += 1;
        accSums[idx] += (item.confidence || 0);
        accCounts[idx] += 1;
      }
    });

    const activity = hours.map((label, i) => ({
      label,
      value: counts[i]
    }));

    const accuracy = hours.map((label, i) => ({
      label,
      value: accCounts[i] > 0 ? Math.round(accSums[i] / accCounts[i]) : 0
    }));

    return { activity, accuracy };
  }

  if (timeframe === 'monthly') {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const now = Date.now();
    const weekMs = 7 * 24 * 3600 * 1000;

    const counts = [0, 0, 0, 0];
    const accSums = [0, 0, 0, 0];
    const accCounts = [0, 0, 0, 0];

    history.forEach(item => {
      if (item.timestamp) {
        const diffMs = now - new Date(item.timestamp).getTime();
        const weekIndex = Math.min(3, Math.max(0, 3 - Math.floor(diffMs / weekMs)));
        counts[weekIndex] += 1;
        accSums[weekIndex] += (item.confidence || 0);
        accCounts[weekIndex] += 1;
      }
    });

    const activity = weeks.map((label, i) => ({
      label,
      value: counts[i]
    }));

    const accuracy = weeks.map((label, i) => ({
      label,
      value: accCounts[i] > 0 ? Math.round(accSums[i] / accCounts[i]) : 0
    }));

    return { activity, accuracy };
  }

  // Default: 'weekly'
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayAccSums = [0, 0, 0, 0, 0, 0, 0];
  const dayAccCounts = [0, 0, 0, 0, 0, 0, 0];

  history.forEach(item => {
    if (item.timestamp) {
      const d = new Date(item.timestamp).getDay();
      const dayIdx = d === 0 ? 6 : d - 1;
      dayCounts[dayIdx] += 1;
      dayAccSums[dayIdx] += (item.confidence || 0);
      dayAccCounts[dayIdx] += 1;
    }
  });

  if (rehabStats.history && Array.isArray(rehabStats.history)) {
    rehabStats.history.forEach(entry => {
      if (entry.date) {
        const d = new Date(entry.date).getDay();
        const dayIdx = d === 0 ? 6 : d - 1;
        dayCounts[dayIdx] += 1;
        dayAccSums[dayIdx] += entry.score;
        dayAccCounts[dayIdx] += 1;
      }
    });
  }

  const activity = days.map((label, i) => ({
    label,
    value: dayCounts[i]
  }));

  const accuracy = days.map((label, i) => ({
    label,
    value: dayAccCounts[i] > 0 ? Math.round(dayAccSums[i] / dayAccCounts[i]) : 0
  }));

  return { activity, accuracy };
}
