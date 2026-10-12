import { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './components/dashboard/Dashboard';
import { RecognitionPage } from './components/recognition/RecognitionPage';
import { ComparisonPage } from './components/comparison/ComparisonPage';
import type { NavigationTab } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMockMode] = useState<boolean>(true); // Development mode using mock prediction reference data

  return (
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMockMode={isMockMode}
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
