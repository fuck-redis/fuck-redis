import React, { useState, useEffect } from 'react';
import { NodeClickBehavior, getClickBehavior, setClickBehavior } from './settings';
import './ClickBehaviorSettings.css';

interface ClickBehaviorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: string;
}

const ClickBehaviorSettings: React.FC<ClickBehaviorSettingsProps> = ({
  isOpen,
  onClose,
  currentLang
}) => {
  const [selectedBehavior, setSelectedBehavior] = useState<NodeClickBehavior>('animation');
  const isZh = currentLang === 'zh';

  // 加载当前设置
  useEffect(() => {
    if (isOpen) {
      const currentBehavior = getClickBehavior();
      setSelectedBehavior(currentBehavior);
    }
  }, [isOpen]);

  // 保存设置
  const handleSave = () => {
    setClickBehavior(selectedBehavior);
    onClose();
  };

  // 取消
  const handleCancel = () => {
    onClose();
  };

  // 点击遮罩层关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const t = (key: string): string => {
    // 简化处理，实际项目中应该使用 i18n
    const translations: Record<string, Record<string, string>> = {
      title: {
        zh: '节点点击行为设置',
        en: 'Node Click Behavior Settings'
      },
      description: {
        zh: '选择单击数据结构节点时的默认行为',
        en: 'Choose the default behavior when clicking a data structure node'
      },
      'option.animation.label': {
        zh: '动画演示',
        en: 'Animation Demo'
      },
      'option.animation.desc': {
        zh: '打开 GitHub Pages 动画演示站点',
        en: 'Open GitHub Pages animation demo site'
      },
      'option.redis.label': {
        zh: 'Redis 文档',
        en: 'Redis Docs'
      },
      'option.redis.desc': {
        zh: '打开 Redis 官方文档页面',
        en: 'Open Redis official documentation'
      },
      'option.none.label': {
        zh: '无动作',
        en: 'No Action'
      },
      'option.none.desc': {
        zh: '仅选中节点，不跳转',
        en: 'Only select the node, no navigation'
      },
      save: {
        zh: '保存',
        en: 'Save'
      },
      cancel: {
        zh: '取消',
        en: 'Cancel'
      }
    };
    return translations[key]?.[isZh ? 'zh' : 'en'] || key;
  };

  const options: { value: NodeClickBehavior; labelKey: string; descKey: string }[] = [
    {
      value: 'animation',
      labelKey: 'option.animation.label',
      descKey: 'option.animation.desc'
    },
    {
      value: 'redis',
      labelKey: 'option.redis.label',
      descKey: 'option.redis.desc'
    },
    {
      value: 'none',
      labelKey: 'option.none.label',
      descKey: 'option.none.desc'
    }
  ];

  return (
    <div
      className="click-behavior-settings-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
    >
      <div className="click-behavior-settings-modal">
        <div className="settings-header">
          <h2>{t('title')}</h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label={isZh ? '关闭' : 'Close'}
          >
            ×
          </button>
        </div>

        <div className="settings-content">
          <p className="settings-description">{t('description')}</p>

          <div className="behavior-options">
            {options.map((option) => (
              <label
                key={option.value}
                className={`behavior-option ${selectedBehavior === option.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="clickBehavior"
                  value={option.value}
                  checked={selectedBehavior === option.value}
                  onChange={() => setSelectedBehavior(option.value)}
                />
                <span className="radio-indicator" />
                <div className="option-content">
                  <span className="option-label">{t(option.labelKey)}</span>
                  <span className="option-description">{t(option.descKey)}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-footer">
          <button
            className="btn-cancel"
            onClick={handleCancel}
          >
            {t('cancel')}
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClickBehaviorSettings;