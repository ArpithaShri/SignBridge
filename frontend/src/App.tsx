import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './components/dashboard/Dashboard';
import { RecognitionPage } from './components/recognition/RecognitionPage';
import { ComparisonPage } from './components/comparison/ComparisonPage';
import { checkBackendHealth } from './services/recognitionApi';
import type { NavigationTab } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  // Poll or check backend health on mount
  useEffect(() => {
    let isMounted = true;

    const verifyHealth = async () => {
      const health = await checkBackendHealth();
      if (isMounted) {
        if (health.isOnline && health.modelLoaded) {
          setBackendConnected(true);
          setIsMockMode(false);
        } else {
          setBackendConnected(false);
          setIsMockMode(true);
        }
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMockMode={isMockMode}
        backendConnected={backendConnected}
      />

      <main id="main-content" className="main-content">
        {currentTab === 'dashboard' && (
          <Dashboard onNavigate={setCurrentTab} />
        )}

        {currentTab === 'recognition' && (
          <RecognitionPage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'comparison' && (
          <ComparisonPage />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
