import React, { useState } from 'react';
import { FlaskConical, Cpu, Layers, Zap } from 'lucide-react';
import { GanCnnPage } from './GanCnnPage';
import { GanCnnLstmPlaceholder } from './GanCnnLstmPlaceholder';
import { GanMobileNetV2Placeholder } from './GanMobileNetV2Placeholder';

export type LabEval2ModelTab = 'gan-cnn' | 'gan-cnn-lstm' | 'gan-mobilenetv2';

export const LabEval2Container: React.FC = () => {
  const [activeModelTab, setActiveModelTab] = useState<LabEval2ModelTab>('gan-cnn');

  return (
    <div className="lab2-page-container">
      {/* Top Banner and Navigation for Lab Eval 2 */}
      <div className="lab2-nav-header">
        <div className="lab2-nav-title-group">
          <div className="lab2-nav-badge">
            <FlaskConical size={18} className="text-brand" />
            <span className="font-semibold text-primary">Lab Evaluation 2</span>
            <span className="badge badge-brand text-[10px]">Generative AI Research</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mt-1">
            Comparative Generative Data Augmentation for Indian Sign Language
          </h1>
          <p className="text-xs text-secondary mt-1 max-w-3xl">
            A comprehensive empirical study analyzing whether conditional GAN-synthesized data mitigates severe class imbalance 
            and improves spatial and spatio-temporal sign classification across 76 Indian Sign Language word classes.
          </p>
        </div>

        {/* 3 Model Tabs */}
        <div className="lab2-subnav-tabs" role="tablist" aria-label="Lab Evaluation 2 Model Architectures">
          <button
            id="tab-lab2-gan-cnn"
            type="button"
            className={`lab2-subnav-btn ${activeModelTab === 'gan-cnn' ? 'active' : ''}`}
            onClick={() => setActiveModelTab('gan-cnn')}
            role="tab"
            aria-selected={activeModelTab === 'gan-cnn'}
          >
            <Cpu size={15} />
            <span>1. GAN + CNN</span>
            <span className="badge badge-success text-[10px] ml-1">Verified</span>
          </button>

          <button
            id="tab-lab2-gan-cnn-lstm"
            type="button"
            className={`lab2-subnav-btn ${activeModelTab === 'gan-cnn-lstm' ? 'active' : ''}`}
            onClick={() => setActiveModelTab('gan-cnn-lstm')}
            role="tab"
            aria-selected={activeModelTab === 'gan-cnn-lstm'}
          >
            <Layers size={15} />
            <span>2. GAN + CNN-LSTM</span>
            <span className="badge badge-amber text-[10px] ml-1">Pending</span>
          </button>

          <button
            id="tab-lab2-gan-mobilenetv2"
            type="button"
            className={`lab2-subnav-btn ${activeModelTab === 'gan-mobilenetv2' ? 'active' : ''}`}
            onClick={() => setActiveModelTab('gan-mobilenetv2')}
            role="tab"
            aria-selected={activeModelTab === 'gan-mobilenetv2'}
          >
            <Zap size={15} />
            <span>3. GAN + MobileNetV2</span>
            <span className="badge badge-amber text-[10px] ml-1">Pending</span>
          </button>
        </div>
      </div>

      {/* Main Model Content */}
      <div className="lab2-tab-content mt-4">
        {activeModelTab === 'gan-cnn' && (
          <GanCnnPage onNavigateToTab={setActiveModelTab} />
        )}

        {activeModelTab === 'gan-cnn-lstm' && (
          <GanCnnLstmPlaceholder onBackToGanCnn={() => setActiveModelTab('gan-cnn')} />
        )}

        {activeModelTab === 'gan-mobilenetv2' && (
          <GanMobileNetV2Placeholder onBackToGanCnn={() => setActiveModelTab('gan-cnn')} />
        )}
      </div>
    </div>
  );
};
