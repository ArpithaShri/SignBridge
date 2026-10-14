import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Layers, 
  Image as ImageIcon, 
  Cpu, 
  BarChart3, 
  RefreshCw
} from 'lucide-react';
import type { LabEval2MetadataData } from '../../types';
import { getLabEval2Metadata } from '../../services/labEval2Api';
import { LabEval2Overview } from './LabEval2Overview';
import { LabEval2Gallery } from './LabEval2Gallery';
import { LabEval2Classifier } from './LabEval2Classifier';
import { LabEval2Dashboard } from './LabEval2Dashboard';

export type LabEval2SubTab = 'overview' | 'gallery' | 'classifier' | 'dashboard';

export const LabEval2Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabEval2SubTab>('overview');
  const [metadata, setMetadata] = useState<LabEval2MetadataData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cross-tab transfer state: passing image from gallery to classifier
  const [preloadedImageUrl, setPreloadedImageUrl] = useState<string | null>(null);
  const [preloadedImageLabel, setPreloadedImageLabel] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      setLoading(true);
      try {
        const data = await getLabEval2Metadata();
        setMetadata(data);
      } catch (err) {
        console.error('Failed to load LabEval2 metadata:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  const handleTestImageWithClassifier = (imageUrl: string, label: string) => {
    setPreloadedImageUrl(imageUrl);
    setPreloadedImageLabel(label);
    setActiveTab('classifier');
  };

  return (
    <div className="lab2-page-container">
      {/* Sub-navigation Header */}
      <div className="lab2-nav-header">
        <div className="lab2-nav-title-group">
          <div className="lab2-nav-badge">
            <FlaskConical size={18} className="text-brand" />
            <span className="font-semibold text-primary">Lab Evaluation 2</span>
          </div>
          <h2 className="text-xl font-bold text-primary mt-1">
            Conditional DCGAN Data Augmentation vs. Baseline CNN
          </h2>
          <span className="text-xs text-secondary">
            5 Selected Classes • 64×64 RGB Frames • Clean Test Accuracy: 20.0%
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="lab2-subnav-tabs" role="tablist">
          <button
            id="tab-lab2-overview"
            type="button"
            className={`lab2-subnav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            role="tab"
            aria-selected={activeTab === 'overview'}
          >
            <Layers size={14} />
            <span>Overview</span>
          </button>

          <button
            id="tab-lab2-gallery"
            type="button"
            className={`lab2-subnav-btn ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
            role="tab"
            aria-selected={activeTab === 'gallery'}
          >
            <ImageIcon size={14} />
            <span>Gallery & Generator</span>
          </button>

          <button
            id="tab-lab2-classifier"
            type="button"
            className={`lab2-subnav-btn ${activeTab === 'classifier' ? 'active' : ''}`}
            onClick={() => setActiveTab('classifier')}
            role="tab"
            aria-selected={activeTab === 'classifier'}
          >
            <Cpu size={14} />
            <span>Classifier Testing</span>
          </button>

          <button
            id="tab-lab2-dashboard"
            type="button"
            className={`lab2-subnav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            role="tab"
            aria-selected={activeTab === 'dashboard'}
          >
            <BarChart3 size={14} />
            <span>Results & Analytics</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="lab2-tab-content mt-6">
        {loading && !metadata ? (
          <div className="lab2-loading-box py-16">
            <RefreshCw size={32} className="animate-spin text-brand mb-3" />
            <span className="text-secondary text-sm">Loading Lab Evaluation 2 metadata and models...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && metadata && (
              <LabEval2Overview
                metadata={metadata}
                onNavigateSection={setActiveTab}
              />
            )}

            {activeTab === 'gallery' && (
              <LabEval2Gallery
                onTestImageWithClassifier={handleTestImageWithClassifier}
              />
            )}

            {activeTab === 'classifier' && (
              <LabEval2Classifier
                initialImageUrl={preloadedImageUrl}
                initialImageLabel={preloadedImageLabel}
              />
            )}

            {activeTab === 'dashboard' && (
              <LabEval2Dashboard />
            )}
          </>
        )}
      </div>
    </div>
  );
};
