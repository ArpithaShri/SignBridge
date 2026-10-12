import React from 'react';
import { Layers, Video, BarChart3, Sparkles, Activity } from 'lucide-react';
import type { NavigationTab } from '../../types';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMockMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, isMockMode }) => {
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
        </nav>

        <div className="nav-status-group">
          {isMockMode ? (
            <div 
              className="badge badge-amber" 
              title="Interface is currently running with simulated mock inference data for testing"
            >
              <Activity size={12} />
              <span>Simulated Mock Mode</span>
            </div>
          ) : (
            <div className="badge badge-success">
              <Activity size={12} />
              <span>Live Backend Connected</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
