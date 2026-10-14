import { Layers, Video, BarChart3, Sparkles, CheckCircle2, WifiOff, FlaskConical } from 'lucide-react';
import type { NavigationTab } from '../../types';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMockMode?: boolean;
  backendConnected: boolean;
}

export const Navbar = ({ currentTab, onSelectTab, backendConnected }: NavbarProps) => {
  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <div 
          className="brand-wrapper" 
          onClick={() => onSelectTab('dashboard')} 
          role="button" 
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectTab('dashboard')}
          aria-label="SignBridge Home"
        >
          <div className="brand-logo-badge">
            <Sparkles size={22} />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">
              SignBridge
              <span className="badge badge-brand">76 Classes</span>
            </span>
            <span className="brand-tagline">Indian Sign Language Video Recognition</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            id="nav-tab-dashboard"
            type="button"
            className={`nav-tab-button ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
            aria-selected={currentTab === 'dashboard'}
          >
            <Layers size={16} />
            <span>Dashboard</span>
          </button>
          
          <button
            id="nav-tab-recognition"
            type="button"
            className={`nav-tab-button ${currentTab === 'recognition' ? 'active' : ''}`}
            onClick={() => onSelectTab('recognition')}
            aria-selected={currentTab === 'recognition'}
          >
            <Video size={16} />
            <span>ISL Recognition</span>
          </button>

          <button
            id="nav-tab-comparison"
            type="button"
            className={`nav-tab-button ${currentTab === 'comparison' ? 'active' : ''}`}
            onClick={() => onSelectTab('comparison')}
            aria-selected={currentTab === 'comparison'}
          >
            <BarChart3 size={16} />
            <span>Model Comparison</span>
          </button>

          <button
            id="nav-tab-lab-eval2"
            type="button"
            className={`nav-tab-button ${currentTab === 'lab-eval2' ? 'active' : ''}`}
            onClick={() => onSelectTab('lab-eval2')}
            aria-selected={currentTab === 'lab-eval2'}
          >
            <FlaskConical size={16} />
            <span>Lab Evaluation 2 — GAN + CNN</span>
          </button>
        </nav>

        <div className="nav-status-group">
          {backendConnected ? (
            <div
              id="badge-backend-status"
              className="badge badge-success"
              title="Connected to live Python FastAPI multi-model backend (Port 8000)"
            >
              <CheckCircle2 size={12} />
              <span>Neural Engine Live</span>
            </div>
          ) : (
            <div
              id="badge-backend-status"
              className="badge badge-amber"
              title="FastAPI backend is offline. Start the backend with: cd backend && venv\Scripts\python -m uvicorn app.main:app --port 8000"
            >
              <WifiOff size={12} />
              <span>Backend Offline</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
