import React from 'react';
import { HeroSection } from './HeroSection';
import { ModelCards } from './ModelCards';
import { PipelineFlow } from './PipelineFlow';
import { VocabularyPreview } from './VocabularyPreview';
import type { NavigationTab } from '../../types';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="dashboard-page fade-in">
      <HeroSection
        onStartRecognition={() => onNavigate('recognition')}
        onCompareModels={() => onNavigate('comparison')}
      />

      <ModelCards />

      <PipelineFlow />

      <VocabularyPreview />
    </div>
  );
};
