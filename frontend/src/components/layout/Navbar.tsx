import React, { useState } from 'react';
import { 
  Layers, 
  Video, 
  BarChart3, 
  FlaskConical, 
  Sparkles, 
  CheckCircle2, 
  WifiOff, 
  Sun, 
  Moon, 
  Menu, 
  X 
} from 'lucide-react';
import type { NavigationTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMockMode?: boolean;
  backendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, backendConnected }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectTab = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        {/* Brand / Logo Section */}
        <div 
          className="brand-wrapper" 
          onClick={() => handleSelectTab('dashboard')} 
          role="button" 
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSelectTab('dashboard')}
          aria-label="SignBridge Home"
        >
          <div className="brand-logo-badge" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div className="brand-text-group">
            <div className="brand-name">
              <span>SignBridge</span>
              <span className="badge badge-brand">76 Classes</span>
            </div>
            <span className="brand-tagline">Indian Sign Language Video Recognition</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-tabs desktop-only" aria-label="Main Navigation">
          <button
            id="nav-tab-dashboard"
            type="button"
            className={`nav-tab-button ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleSelectTab('dashboard')}
            aria-selected={currentTab === 'dashboard'}
          >
            <Layers size={15} />
            <span>Dashboard</span>
          </button>
          
          <button
            id="nav-tab-recognition"
            type="button"
            className={`nav-tab-button ${currentTab === 'recognition' ? 'active' : ''}`}
            onClick={() => handleSelectTab('recognition')}
            aria-selected={currentTab === 'recognition'}
          >
            <Video size={15} />
            <span>ISL Recognition</span>
          </button>

          <button
            id="nav-tab-comparison"
            type="button"
            className={`nav-tab-button ${currentTab === 'comparison' ? 'active' : ''}`}
            onClick={() => handleSelectTab('comparison')}
            aria-selected={currentTab === 'comparison'}
          >
            <BarChart3 size={15} />
            <span>Model Comparison</span>
          </button>

          <button
            id="nav-tab-lab-eval-2"
            type="button"
            className={`nav-tab-button ${currentTab === 'lab-eval-2' ? 'active' : ''}`}
            onClick={() => handleSelectTab('lab-eval-2')}
            aria-selected={currentTab === 'lab-eval-2'}
          >
            <FlaskConical size={15} className="text-brand-accent" />
            <span>Lab Eval 2</span>
            <span className="badge badge-brand-subtle text-[10px]">Research</span>
          </button>
        </nav>

        {/* Right Status & Controls */}
        <div className="nav-status-group">
          {/* Light / Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-theme" />
            ) : (
              <Moon size={17} className="text-indigo-theme" />
            )}
          </button>

          {/* Backend Connection Status Badge */}
          {backendConnected ? (
            <div
              id="badge-backend-status"
              className="badge badge-success"
              title="Connected to live Python FastAPI multi-model backend (Port 8000)"
            >
              <CheckCircle2 size={12} />
              <span className="status-text-full">Neural Engine Live</span>
              <span className="status-text-mobile">Live</span>
            </div>
          ) : (
            <div
              id="badge-backend-status"
              className="badge badge-amber"
              title="FastAPI backend is offline. Start the backend with: cd backend && venv\Scripts\python -m uvicorn app.main:app --port 8000"
            >
              <WifiOff size={12} />
              <span className="status-text-full">Backend Offline</span>
              <span className="status-text-mobile">Offline</span>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <nav className="mobile-nav-menu" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleSelectTab('dashboard')}
          >
            <Layers size={18} />
            <span>Dashboard</span>
          </button>
          
          <button
            type="button"
            className={`mobile-nav-item ${currentTab === 'recognition' ? 'active' : ''}`}
            onClick={() => handleSelectTab('recognition')}
          >
            <Video size={18} />
            <span>ISL Recognition</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${currentTab === 'comparison' ? 'active' : ''}`}
            onClick={() => handleSelectTab('comparison')}
          >
            <BarChart3 size={18} />
            <span>Model Comparison</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${currentTab === 'lab-eval-2' ? 'active' : ''}`}
            onClick={() => handleSelectTab('lab-eval-2')}
          >
            <FlaskConical size={18} />
            <span>Lab Eval 2 (Generative AI Research)</span>
          </button>
        </nav>
      )}
    </header>
  );
};
