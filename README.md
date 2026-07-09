# EchoScribe — Project Objective & Architecture Specification

EchoScribe (internally named *BehraHogyaHu*) is a Progressive Web Application (PWA) designed to serve as an adaptive voice assistant, safety dashboard, and speech rehabilitation platform for individuals with speech and hearing difficulties.

---

## 1. Core Objective

The primary objective of EchoScribe is to bridge the communication gap for individuals with speech impairments or hearing loss. By providing real-time speech-to-text translation, phonetic corrections, structured vocal rehabilitation drills, custom vocabulary training, and one-tap emergency safety mechanisms, the app empowers users to communicate confidently, improve their speech clarity, and remain safe in stressful situations.

---

## 2. Core Modules & Feature Breakdown

### A. Live Transcription Mode (`LiveTranscription.jsx`)
*   **What it is**: A real-time speech capture and translation board.
*   **How it works**:
    *   Leverages the browser's Speech Recognition API to capture raw microphone input.
    *   Passes captured text to a custom speech engine (`speechEngine.js`) that corrects speech patterns against a personalized vocabulary mapping dictionary.
    *   Features fuzzy and phonetic matching algorithms to resolve mispronounced words into the user's intended phrases.

### B. Speech Rehabilitation Hub (`Rehabilitation.jsx`)
*   **What it is**: An articulation practice workshop containing daily drills.
*   **How it works**:
    *   Provides structured drills: **Vocal Projection**, **Consonant Clarity**, **Daily Sentence Reading**, and **Breath Pacing**.
    *   Uses microphone feedback to score user articulation.
    *   Saves completion history to `localStorage` and updates key statistics: Clarity Score, Articulation Consistency, Daily Streaks, and Weekly Improvement Trendlines (plotted via `ChartMock.jsx`).

### C. Voice Model Training Hub (`TrainingPage.jsx`)
*   **What it is**: An adaptive calibration center to customize phonetic matching rules.
*   **How it works**:
    *   Guides users through recording reference audio for training phrases.
    *   Displays progress indicators including "Model Readiness %" based on completed training items (target of 12 phrases for optimal matching accuracy).

### D. Emergency Safety Hub & Widgets (`Emergency.jsx`, `DirectCall.jsx`, `Layout.jsx`, `Dashboard.jsx`)
*   **What it is**: An instantly accessible safety dashboard for stressful situations.
*   **How it works**:
    *   **Tactile Speech Alerts**: Quick buttons configured for common emergencies (Medical, Family Assistance, Help Needed). When tapped, the app plays high-volume text-to-speech scripts and performs mock GPS coordinate broadcasting.
    *   **Direct Phone Dialer Option**: A settings switch allows the user to choose their preferred shortcut action for the global Floating SOS Button and Dashboard SOS Widget:
        *   *Standard Mode (Disabled)*: Tapping the widget opens the app's Safety Hub panel or Layout Modal to allow secondary actions.
        *   *Direct Dialer Mode (Enabled)*: Tapping the widget navigates directly to the `/direct-call` route.
    *   **Direct Call Gateway (`DirectCall.jsx`)**: Centered layout displaying a styled modal popup: `"Open Phone Dialer? Do you want to launch your device's native dialer to call [Name]?"`. Clicking "Open Dialer" spawns a hidden anchor with `target="_blank"` to trigger the dialer prompt cleanly, preventing PWA container exits or blank screens.
    *   **PWA OS Widget click integration (`sw.js`)**: Clicking the widget on the OS home screen triggers the service worker, which resolves primary contacts from the Cache Storage API and opens `/direct-call` to display the confirmation popup modal immediately.

### E. Accessibility Suite (`Accessibility.jsx`)
*   **What it is**: Accessibility controls tailored for auditory and visual assistance.
*   **How it works**:
    *   Provides toggle controls for Large Text, High Contrast Mode, Dyslexia-Friendly Typography, Keyboard Navigation, and Reduced Animations.
    *   Directly hooks into the React context (`AppContext.jsx`) to toggle specific CSS classes on the `<html>` root, adjusting visual themes system-wide.

---

## 3. Data Persistence & Cache Architecture

EchoScribe operates strictly under a "Privacy First" policy. All user data, metrics, and configurations are stored client-side:

| Storage Type | Target Data | Synchronization / Purpose |
| :--- | :--- | :--- |
| **Local Storage** | Settings, contact lists, custom word maps, streaks, progress metrics, and achievements. | Persistent config storage across page refreshes and offline sessions. |
| **Cache Storage API** | `/api/primary-phone`, `/api/direct-dial-bypass` | Service Worker read/write cache to handle PWA desktop/mobile widget taps offline. |
| **Service Worker (`sw.js`)** | Static PWA assets (`/index.html`, `/manifest.json`, icons) | Facilitates instant, offline-first network loading and background widget interactions. |

