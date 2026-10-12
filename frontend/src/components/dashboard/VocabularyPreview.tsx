import React, { useState } from 'react';
import { ISL_SAMPLE_CLASSES } from '../../data/modelsData';

export const VocabularyPreview: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Greetings', 'Relations', 'Nouns', 'Actions', 'Common Phrases', 'Numbers'];

  const filteredWords = selectedCategory === 'All'
    ? ISL_SAMPLE_CLASSES
    : ISL_SAMPLE_CLASSES.filter(c => c.category === selectedCategory);

  return (
    <section className="glass-card vocabulary-box" aria-labelledby="vocab-heading">
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <span className="section-tag">Dataset Classes</span>
        <h2 id="vocab-heading" className="section-title">76 ISL Word Vocabulary Reference</h2>
        <p className="section-subtitle">
          The SignBridge dataset contains 76 discrete Indian Sign Language word classes covering essential communication domains.
        </p>
      </div>

      <div className="vocab-categories-filter">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`vocab-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat} {cat === 'All' ? `(76)` : ''}
          </button>
        ))}
      </div>

      <div className="vocab-tags-cloud">
        {filteredWords.map((item) => (
          <div key={item.index} className="vocab-word-tag">
            <span className="vocab-word-index">#{String(item.index + 1).padStart(2, '0')}</span>
            <span>{item.word}</span>
          </div>
        ))}
        {selectedCategory === 'All' && (
          <div className="vocab-word-tag" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-400)' }}>
            <span>+ 23 additional balanced classes across full 76 set</span>
          </div>
        )}
      </div>
    </section>
  );
};
