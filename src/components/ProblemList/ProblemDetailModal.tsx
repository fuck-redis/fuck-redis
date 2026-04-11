import React from 'react';
import { Problem } from './types';
import './ProblemDetailModal.css';

interface ProblemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  currentLang: string;
  t: (key: string) => string;
}

const ProblemDetailModal: React.FC<ProblemDetailModalProps> = ({
  isOpen,
  onClose,
  problem,
  currentLang,
  t
}) => {
  if (!isOpen || !problem) return null;

  const title = currentLang === 'zh' ? problem.translatedTitle : problem.title;

  const getDifficultyClass = (difficulty: string) => {
    return difficulty.toLowerCase();
  };

  return (
    <div className="problem-detail-overlay" onClick={onClose}>
      <div className="problem-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header">
          <div className="detail-title-row">
            <span className={`detail-difficulty ${getDifficultyClass(problem.difficulty)}`}>
              {t(`difficulties.${problem.difficulty.toLowerCase()}`)}
            </span>
            <h2 className="detail-title">{title}</h2>
          </div>
          <button className="detail-close" onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className="detail-content">
          {/* Description */}
          {problem.description && (
            <section className="detail-section">
              <h3 className="detail-section-title">
                {currentLang === 'zh' ? '📖 核心描述' : '📖 Description'}
              </h3>
              <p className="detail-description">{problem.description}</p>
            </section>
          )}

          {/* Key Points */}
          {problem.keyPoints && problem.keyPoints.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">
                {currentLang === 'zh' ? '⚡ 关键特点' : '⚡ Key Points'}
              </h3>
              <ul className="detail-list">
                {problem.keyPoints.map((point, index) => (
                  <li key={index} className="detail-list-item">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Operations */}
          {problem.operations && problem.operations.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">
                {currentLang === 'zh' ? '🔧 主要操作' : '🔧 Operations'}
              </h3>
              <div className="detail-operations">
                {problem.operations.map((op, index) => (
                  <div key={index} className="detail-operation">
                    <code>{op.split(' - ')[0]}</code>
                    {op.includes(' - ') && (
                      <span className="op-desc">{op.split(' - ')[1]}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Use Cases */}
          {problem.useCases && problem.useCases.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">
                {currentLang === 'zh' ? '💡 适用场景' : '💡 Use Cases'}
              </h3>
              <ul className="detail-list">
                {problem.useCases.map((useCase, index) => (
                  <li key={index} className="detail-list-item">
                    {useCase}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Content Sections */}
          {problem.contentSections && problem.contentSections.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">
                {currentLang === 'zh' ? '📚 详细内容' : '📚 Content'}
              </h3>
              {problem.contentSections.map((section, index) => (
                <div key={index} className="detail-content-section">
                  <h4 className="detail-content-title">{section.title}</h4>
                  <p className="detail-content-text">{section.content}</p>
                </div>
              ))}
            </section>
          )}

          {/* Tags */}
          {problem.topicTags && problem.topicTags.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">
                {currentLang === 'zh' ? '🏷️ 相关标签' : '🏷️ Tags'}
              </h3>
              <div className="detail-tags">
                {problem.topicTags.map(tag => (
                  <span key={tag.slug} className="detail-tag">
                    {currentLang === 'zh' ? tag.nameTranslated : tag.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Repo Info */}
          {problem.repo && (
            <section className="detail-section detail-repo">
              <h3 className="detail-section-title">
                {currentLang === 'zh' ? '🔗 相关仓库' : '🔗 Repository'}
              </h3>
              <div className="detail-repo-info">
                <span className="repo-name">{problem.repo.name}</span>
                {problem.repo.isPublic && problem.repo.pagesUrl && (
                  <a
                    href={problem.repo.pagesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="repo-link"
                  >
                    {currentLang === 'zh' ? '访问演示' : 'View Demo'} →
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailModal;