import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Problem } from '../types';
import Tooltip from '../../Tooltip';
import AnimationBadge from '../AnimationBadge';
import TreasureNode from './TreasureNode';
import ClickBehaviorSettings from './ClickBehaviorSettings';
import { getClickBehavior, handleNodeClickWithBehavior } from './settings';
import './DuolingoPath.css';

interface DuolingoPathProps {
  problems: Problem[];
  allProblems?: Problem[]; // 原始完整题目列表，用于宝箱判断
  currentLang: string;
  t: (key: string) => string;
  selectedTags: string[];
  toggleTag: (tagSlug: string) => void;
  handleAnimationClick: (
    event: React.MouseEvent, 
    questionId: string, 
    hasAnimation: boolean,
    title?: string,
    t?: (key: string) => string,
    pagesUrl?: string | null
  ) => void;
  isCompleted: (problemId: string) => boolean;
  onToggleCompletion: (problemId: string) => Promise<void>;
  pathId?: string; // 用于生成唯一的宝箱ID
}

// 分段配置：每段的题目数量
const SEGMENT_SIZE = 5;
// 分段之间的额外间距（包含宝箱节点）
const SEGMENT_GAP = 220;
// 节点之间的基础间距
const NODE_SPACING = 180;

// 智能计算分段，避免最后一段太短
const calculateSegments = (totalProblems: number): number[] => {
  // 5题及以下：不分段，只有终点宝箱
  if (totalProblems <= 5) {
    return [totalProblems];
  }
  
  // 6-7题：分成两段（3+3 或 3+4）
  if (totalProblems <= 7) {
    const firstHalf = Math.floor(totalProblems / 2);
    return [firstHalf, totalProblems - firstHalf];
  }
  
  // 8题及以上：每5题一段，但确保最后一段至少3题
  const segments: number[] = [];
  let remaining = totalProblems;
  
  while (remaining > 0) {
    if (remaining <= 7) {
      // 剩余7题及以下，平均分成最后两段
      if (remaining <= 5) {
        segments.push(remaining);
      } else {
        const firstHalf = Math.floor(remaining / 2);
        segments.push(firstHalf);
        segments.push(remaining - firstHalf);
      }
      break;
    }
    segments.push(SEGMENT_SIZE);
    remaining -= SEGMENT_SIZE;
  }
  
  return segments;
};

const DuolingoPath: React.FC<DuolingoPathProps> = ({
  problems,
  allProblems,
  currentLang,
  t,
  isCompleted,
  onToggleCompletion,
  pathId = 'default'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 点击外部关闭展开的节点和菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (expandedNodeId && !target.closest('.duolingo-node-wrapper') && !target.closest('.node-context-menu')) {
        setExpandedNodeId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [expandedNodeId]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 计算分段信息和宝箱位置
  const segmentInfo = useMemo(() => {
    const totalProblems = problems.length;
    const segmentSizes = calculateSegments(totalProblems);
    const segmentCount = segmentSizes.length;
    const segments: { 
      startIndex: number; 
      endIndex: number; 
      completedCount: number;
      isComplete: boolean;
    }[] = [];
    
    let currentIndex = 0;
    for (let i = 0; i < segmentCount; i++) {
      const segmentSize = segmentSizes[i];
      const startIndex = currentIndex;
      const endIndex = currentIndex + segmentSize - 1;
      
      // 计算该分段的完成数量
      let completedCount = 0;
      for (let j = startIndex; j <= endIndex; j++) {
        if (isCompleted(problems[j].questionFrontendId)) {
          completedCount++;
        }
      }
      
      segments.push({ 
        startIndex, 
        endIndex, 
        completedCount,
        isComplete: completedCount === segmentSize
      });
      
      currentIndex = endIndex + 1;
    }
    
    return { segmentCount, segments, segmentSizes };
  }, [problems, isCompleted]);

  // 基于原始完整题目列表计算宝箱解锁状态（防止筛选后作弊）
  const originalSegmentInfo = useMemo(() => {
    const originalProblems = allProblems || problems;
    const totalProblems = originalProblems.length;
    const segmentSizes = calculateSegments(totalProblems);
    const segmentCount = segmentSizes.length;
    const segments: { 
      startIndex: number; 
      endIndex: number; 
      completedCount: number;
      isComplete: boolean;
    }[] = [];
    
    let currentIndex = 0;
    for (let i = 0; i < segmentCount; i++) {
      const segmentSize = segmentSizes[i];
      const startIndex = currentIndex;
      const endIndex = currentIndex + segmentSize - 1;
      
      // 计算该分段的完成数量
      let completedCount = 0;
      for (let j = startIndex; j <= endIndex; j++) {
        if (isCompleted(originalProblems[j].questionFrontendId)) {
          completedCount++;
        }
      }
      
      segments.push({ 
        startIndex, 
        endIndex, 
        completedCount,
        isComplete: completedCount === segmentSize
      });
      
      currentIndex = endIndex + 1;
    }
    
    return { segmentCount, segments, segmentSizes };
  }, [allProblems, problems, isCompleted]);

  // 计算是否所有题目都已完成（基于原始题目列表）
  const allProblemsCompleted = useMemo(() => {
    const originalProblems = allProblems || problems;
    return originalProblems.every(problem => isCompleted(problem.questionFrontendId));
  }, [allProblems, problems, isCompleted]);

  // 判断某个索引是否是分段的最后一个节点（不包括整个路径的最后一个）
  const isSegmentEnd = useCallback((index: number) => {
    // 检查是否是某个分段的最后一个节点
    for (const segment of segmentInfo.segments) {
      if (index === segment.endIndex && index < problems.length - 1) {
        return true;
      }
    }
    return false;
  }, [segmentInfo.segments, problems.length]);

  // 获取某个索引所在的分段编号
  const getSegmentIndex = useCallback((index: number) => {
    for (let i = 0; i < segmentInfo.segments.length; i++) {
      const segment = segmentInfo.segments[i];
      if (index >= segment.startIndex && index <= segment.endIndex) {
        return i;
      }
    }
    return 0;
  }, [segmentInfo.segments]);

  // 简化的蜿蜒路径布局（考虑分段间距）
  const getNodePosition = useCallback((index: number) => {
    const centerX = containerWidth / 2;
    const amplitude = Math.min(80, (containerWidth - 140) / 3);
    
    // 平滑的S形曲线
    const phase = (index * Math.PI) / 1.5;
    const xOffset = Math.sin(phase) * amplitude;
    let xPixel = centerX + xOffset;
    
    // 边界限制
    const margin = 60;
    xPixel = Math.max(margin, Math.min(containerWidth - margin, xPixel));
    
    const xPercent = (xPixel / containerWidth) * 100;
    
    // 计算Y位置
    // 找出当前节点属于哪个分段，以及之前有多少个完整分段（即多少个宝箱）
    let treasureCount = 0;
    for (let i = 0; i < segmentInfo.segments.length; i++) {
      const seg = segmentInfo.segments[i];
      if (index > seg.endIndex) {
        // 这个分段已经完全在当前节点之前，且不是最后一个分段，所以有一个宝箱
        if (i < segmentInfo.segments.length - 1) {
          treasureCount++;
        }
      }
    }
    
    const baseY = index * NODE_SPACING + 100;
    const treasureSpaceOffset = treasureCount * SEGMENT_GAP;
    const yPosition = baseY + treasureSpaceOffset;
    
    return { xPercent, xPixel, yPosition, index };
  }, [containerWidth, segmentInfo.segments]);

  // 获取宝箱节点位置 - 在分段末尾节点和下一分段首节点之间的中点
  const getTreasurePosition = useCallback((segmentIndex: number) => {
    const segment = segmentInfo.segments[segmentIndex];
    const nextSegment = segmentInfo.segments[segmentIndex + 1];
    
    if (!segment || !nextSegment) {
      return { xPercent: 50, xPixel: containerWidth / 2, yPosition: 0 };
    }
    
    // 计算分段末尾节点的位置（不包含宝箱偏移的原始位置）
    const lastNodeBaseY = segment.endIndex * NODE_SPACING + 100 + segmentIndex * SEGMENT_GAP;
    // 计算下一分段首节点的位置
    const nextNodeBaseY = nextSegment.startIndex * NODE_SPACING + 100 + (segmentIndex + 1) * SEGMENT_GAP;
    
    // 宝箱在两者中间
    return {
      xPercent: 50,
      xPixel: containerWidth / 2,
      yPosition: (lastNodeBaseY + nextNodeBaseY) / 2
    };
  }, [containerWidth, segmentInfo.segments]);

  // 获取终点宝箱位置
  const getEndpointTreasurePosition = useCallback(() => {
    const lastNodePos = getNodePosition(problems.length - 1);
    
    return {
      xPercent: 50,
      xPixel: containerWidth / 2,
      yPosition: lastNodePos.yPosition + NODE_SPACING
    };
  }, [getNodePosition, problems.length, containerWidth]);

  // 清除隐藏定时器
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // 隐藏菜单（带延迟）- 增加延迟时间让用户有足够时间移动到菜单
  const hideMenuWithDelay = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setExpandedNodeId(null);
    }, 300); // 从 150ms 增加到 300ms
  }, [clearHideTimeout]);

  // 隐藏菜单（立即）
  const hideMenu = useCallback(() => {
    clearHideTimeout();
    setExpandedNodeId(null);
  }, [clearHideTimeout]);

  // 处理完成状态切换
  const handleToggleCompletion = useCallback(async (problem: Problem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // 防止重复点击
    if (isTogglingCompletion) {
      return;
    }
    
    setIsTogglingCompletion(true);
    
    try {
      await onToggleCompletion(problem.questionFrontendId);
    } catch (error) {
      console.error('切换完成状态失败:', error);
    } finally {
      setIsTogglingCompletion(false);
      hideMenu();
    }
  }, [onToggleCompletion, hideMenu, isTogglingCompletion]);

  // 打开Redis文档页面
  const openRedisPage = useCallback((problem: Problem, e: React.MouseEvent) => {
    e.stopPropagation();
    // 打开 Redis 命令文档
    window.open(`https://redis.io/commands/${problem.titleSlug}/`, '_blank');
    hideMenu();
  }, [hideMenu]);

  // 打开GitHub Pages演示页面
  const openGitHubPages = useCallback((problem: Problem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (problem.hasAnimation && problem.repo?.pagesUrl) {
      window.open(problem.repo.pagesUrl, '_blank');
    }
    hideMenu();
  }, [hideMenu]);

  // 左键单击 - 根据用户设置执行对应行为
  const handleNodeClick = (e: React.MouseEvent, problem: Problem) => {
    e.preventDefault();
    e.stopPropagation();
    
    const behavior = getClickBehavior();
    handleNodeClickWithBehavior(behavior, problem);
  };

  // 右键单击 - 显示菜单
  const handleNodeContextMenu = (e: React.MouseEvent, problem: Problem) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNodeId(problem.questionFrontendId);
  };

  // 鼠标悬停 - 显示菜单
  const handleNodeMouseEnter = useCallback((problemId: string) => {
    clearHideTimeout();
    setExpandedNodeId(problemId);
  }, [clearHideTimeout]);

  // 鼠标离开节点区域
  const handleNodeMouseLeave = useCallback(() => {
    hideMenuWithDelay();
  }, [hideMenuWithDelay]);

  // 鼠标进入菜单区域
  const handleMenuMouseEnter = useCallback(() => {
    clearHideTimeout();
  }, [clearHideTimeout]);

  // 鼠标离开菜单区域
  const handleMenuMouseLeave = useCallback(() => {
    hideMenuWithDelay();
  }, [hideMenuWithDelay]);

  // 获取难度类名
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'difficulty-easy';
      case 'MEDIUM': return 'difficulty-medium';
      case 'HARD': return 'difficulty-hard';
      default: return 'difficulty-medium';
    }
  };

  // 处理宝箱开启
  const handleTreasureOpen = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // 简化的SVG路径连接线
  const generatePathConnections = () => {
    const paths: JSX.Element[] = [];
    
    for (let i = 0; i < problems.length - 1; i++) {
      const current = getNodePosition(i);
      const next = getNodePosition(i + 1);
      
      const currentX = current.xPixel;
      const currentY = current.yPosition;
      const nextX = next.xPixel;
      const nextY = next.yPosition;
      
      const currentCompleted = isCompleted(problems[i].questionFrontendId);
      const nextCompleted = isCompleted(problems[i + 1].questionFrontendId);
      const bothCompleted = currentCompleted && nextCompleted;
      
      // 检查是否是分段末尾（需要连接到宝箱）
      if (isSegmentEnd(i)) {
        const segmentIndex = getSegmentIndex(i);
        const treasurePos = getTreasurePosition(segmentIndex);
        const segment = segmentInfo.segments[segmentIndex];
        
        // 第一段：从当前节点到宝箱
        const midY1 = (currentY + treasurePos.yPosition - 50) / 2;
        paths.push(
          <path
            key={`path-${i}-a`}
            d={`M ${currentX} ${currentY} 
                C ${currentX} ${midY1}, ${treasurePos.xPixel} ${midY1}, ${treasurePos.xPixel} ${treasurePos.yPosition - 50}`}
            stroke={currentCompleted ? '#ffd700' : '#d0d0d0'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
        );
        
        // 第二段：从宝箱到下一个节点
        const midY2 = (treasurePos.yPosition + 50 + nextY) / 2;
        paths.push(
          <path
            key={`path-${i}-b`}
            d={`M ${treasurePos.xPixel} ${treasurePos.yPosition + 50} 
                C ${treasurePos.xPixel} ${midY2}, ${nextX} ${midY2}, ${nextX} ${nextY}`}
            stroke={segment.isComplete && nextCompleted ? '#ffd700' : '#d0d0d0'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
        );
      } else {
        // 普通连接线
        const midY = (currentY + nextY) / 2;
        const pathD = `M ${currentX} ${currentY} C ${currentX} ${midY}, ${nextX} ${midY}, ${nextX} ${nextY}`;
        
        paths.push(
          <path
            key={`path-${i}`}
            d={pathD}
            stroke={bothCompleted ? '#ffd700' : '#d0d0d0'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
    }
    
    // 添加：最后一个节点到终点宝箱的连接线
    const lastNodePos = getNodePosition(problems.length - 1);
    const endpointPos = getEndpointTreasurePosition();
    const lastCompleted = isCompleted(problems[problems.length - 1].questionFrontendId);
    
    const midY = (lastNodePos.yPosition + endpointPos.yPosition - 50) / 2;
    paths.push(
      <path
        key="path-to-endpoint"
        d={`M ${lastNodePos.xPixel} ${lastNodePos.yPosition} 
            C ${lastNodePos.xPixel} ${midY}, ${endpointPos.xPixel} ${midY}, ${endpointPos.xPixel} ${endpointPos.yPosition - 50}`}
        stroke={lastCompleted ? '#ffd700' : '#d0d0d0'}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    );
    
    return paths;
  };

  // 生成宝箱节点
  const generateTreasureNodes = () => {
    const treasures: JSX.Element[] = [];
    
    // 如果是筛选模式（题目数量与原始不同），不显示中间宝箱
    const originalProblems = allProblems || problems;
    if (problems.length !== originalProblems.length) {
      return treasures;
    }
    
    segmentInfo.segments.forEach((segment, segmentIndex) => {
      // 跳过最后一个分段（因为最后有终点标记）
      if (segmentIndex === segmentInfo.segmentCount - 1) return;
      
      const treasurePos = getTreasurePosition(segmentIndex);
      const treasureId = `detail-${pathId}-stage-${segmentIndex + 1}`;
      
      // 使用原始分段信息判断宝箱是否可以开启（防止筛选后作弊）
      const originalSegment = originalSegmentInfo.segments[segmentIndex];
      const canOpenTreasure = originalSegment ? originalSegment.isComplete : false;
      
      treasures.push(
        <div
          key={treasureId}
          className="path-treasure-wrapper"
          style={{
            left: `${treasurePos.xPercent}%`,
            top: treasurePos.yPosition - 40
          }}
        >
          <TreasureNode
            treasureId={treasureId}
            stageNumber={segmentIndex + 1}
            canOpen={canOpenTreasure}
            currentLang={currentLang}
            onOpen={handleTreasureOpen}
          />
        </div>
      );
    });
    
    return treasures;
  };

  // 计算容器高度（考虑分段间距和终点宝箱）
  const containerHeight = useMemo(() => {
    const baseHeight = problems.length * NODE_SPACING + 100;
    const segmentGapTotal = (segmentInfo.segmentCount - 1) * SEGMENT_GAP;
    const endpointTreasureSpace = NODE_SPACING + 150; // 终点宝箱额外空间
    return baseHeight + segmentGapTotal + endpointTreasureSpace;
  }, [problems.length, segmentInfo.segmentCount]);

  if (problems.length === 0) {
    return (
      <div className="duolingo-path-empty">
        <span className="empty-icon">📭</span>
        <p>{currentLang === 'zh' ? '暂无数据结构' : 'No data structures'}</p>
      </div>
    );
  }

  return (
    <div 
      key={refreshKey}
      className="duolingo-path-container" 
      style={{ minHeight: containerHeight }}
      ref={containerRef}
    >
      {/* SVG 连接线 */}
      <svg 
        className="duolingo-path-svg"
        style={{ height: containerHeight }}
        width="100%"
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {generatePathConnections()}
      </svg>
      
      {/* 节点 */}
      <div className="duolingo-nodes-container">
        {problems.map((problem, index) => {
          const position = getNodePosition(index);
          const title = currentLang === 'zh' ? problem.translatedTitle : problem.title;
          const completed = isCompleted(problem.questionFrontendId);
          const difficultyClass = getDifficultyClass(problem.difficulty);
          const pagesUrl = problem.repo?.pagesUrl || null;
          const isExpanded = expandedNodeId === problem.questionFrontendId;
          
          // 当前进度节点（第一个未完成的节点）
          const isCurrentNode = !completed && (index === 0 || isCompleted(problems[index - 1].questionFrontendId));
          
          // 判断是否是分段的最后一个节点
          const isLastInSegment = isSegmentEnd(index);
          
          return (
            <div
              key={problem.id}
              className={`duolingo-node-wrapper ${completed ? 'completed' : ''} ${isCurrentNode ? 'current' : ''} ${isExpanded ? 'expanded' : ''} ${isLastInSegment ? 'segment-end' : ''}`}
              style={{
                left: `${position.xPercent}%`,
                top: position.yPosition - 35
              }}
              onMouseEnter={() => handleNodeMouseEnter(problem.questionFrontendId)}
              onMouseLeave={handleNodeMouseLeave}
            >
              {/* 只在未展开时显示Tooltip，展开时隐藏以避免遮挡菜单 */}
              {!isExpanded ? (
                <Tooltip 
                  content={`#${problem.questionFrontendId} ${title} | ${t(`difficulties.${problem.difficulty.toLowerCase()}`)} | ${(problem.acRate * 100).toFixed(1)}%${problem.hasAnimation ? ' | 🎬' : ''}${completed ? ' | ✓' : ''}`}
                >
                  <div 
                    className={`duolingo-node ${difficultyClass} ${completed ? 'is-completed' : ''} ${isCurrentNode ? 'is-current' : ''}`}
                    onClick={(e) => handleNodeClick(e, problem)}
                    onContextMenu={(e) => handleNodeContextMenu(e, problem)}
                  >
                    <div className="node-inner">
                      {completed ? (
                        <span className="node-checkmark">✓</span>
                      ) : (
                        <span className="node-number">{problem.questionFrontendId}</span>
                      )}
                    </div>
                    
                    {/* 当前节点脉冲动画 */}
                    {isCurrentNode && <div className="node-pulse-ring"></div>}
                    
                    {problem.hasAnimation && (
                      <div className="node-animation-badge-wrapper">
                        <AnimationBadge
                          hasAnimation={problem.hasAnimation}
                          problemId={problem.questionFrontendId}
                          problemTitle={title}
                          pagesUrl={pagesUrl}
                          showPreview={true}
                        />
                      </div>
                    )}
                  </div>
                </Tooltip>
              ) : (
                <div 
                  className={`duolingo-node ${difficultyClass} ${completed ? 'is-completed' : ''} ${isCurrentNode ? 'is-current' : ''}`}
                  onClick={(e) => handleNodeClick(e, problem)}
                  onContextMenu={(e) => handleNodeContextMenu(e, problem)}
                >
                  <div className="node-inner">
                    {completed ? (
                      <span className="node-checkmark">✓</span>
                    ) : (
                      <span className="node-number">{problem.questionFrontendId}</span>
                    )}
                  </div>
                  
                  {/* 当前节点脉冲动画 */}
                  {isCurrentNode && <div className="node-pulse-ring"></div>}
                  
                  {problem.hasAnimation && (
                    <div className="node-animation-badge-wrapper">
                      <AnimationBadge
                        hasAnimation={problem.hasAnimation}
                        problemId={problem.questionFrontendId}
                        problemTitle={title}
                        pagesUrl={pagesUrl}
                        showPreview={true}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* 悬停/右键菜单 */}
              {isExpanded && (
                <div 
                  className="node-context-menu"
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <div className="context-menu-header">
                    <span className="context-menu-id">#{problem.questionFrontendId}</span>
                    <span className={`context-menu-difficulty ${difficultyClass}`}>
                      {t(`difficulties.${problem.difficulty.toLowerCase()}`)}
                    </span>
                  </div>
                  <div className="context-menu-title">{title}</div>
                  <div className="context-menu-actions">
                    {/* 菜单项1: 标记完成/未完成 */}
                    <button 
                      className={`context-menu-btn ${completed ? 'completed' : 'incomplete'}`}
                      onClick={(e) => handleToggleCompletion(problem, e)}
                    >
                      {completed 
                        ? (currentLang === 'zh' ? '✓ 已完成 (点击取消)' : '✓ Completed (click to undo)')
                        : (currentLang === 'zh' ? '○ 标记为已完成' : '○ Mark as complete')
                      }
                    </button>
                    
                    {/* 菜单项2: 跳转到演示页面 */}
                    {problem.hasAnimation && pagesUrl && (
                      <button
                        className="context-menu-btn animation-btn"
                        onClick={(e) => openGitHubPages(problem, e)}
                      >
                        🎬 {currentLang === 'zh' ? '查看动画演示' : 'View Animation'}
                      </button>
                    )}

                    {/* 菜单项3: 跳转到Redis文档 */}
                    <button
                      className="context-menu-btn leetcode-btn"
                      onClick={(e) => openRedisPage(problem, e)}
                    >
                      📝 {currentLang === 'zh' ? '打开 Redis 文档' : 'Open Redis Docs'}
                    </button>
                    
                    {/* 菜单项分割线 */}
                    <div className="context-menu-divider"></div>
                    
                    {/* 菜单项4: 设置默认行为 */}
                    <button 
                      className="context-menu-btn settings-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(true);
                        hideMenu();
                      }}
                    >
                      ⚙️ {currentLang === 'zh' ? '设置默认行为' : 'Set Default Behavior'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* 
                题目ID和名称标签 - 始终显示在节点下方
                【重要警告】此处必须保持一行显示格式！
                严禁将ID和标题分成两行显示，这是产品明确要求。
                如需修改显示格式，请先与产品确认。
              */}
              {!isExpanded && (
                <div className="node-title-label always-visible">
                  {/* ID和标题在同一行显示，用空格分隔 */}
                  <span className="node-id-text">#{problem.questionFrontendId}</span>
                  <span className="node-title-text">{title}</span>
                </div>
              )}
            </div>
          );
        })}
        
        {/* 宝箱节点 */}
        {generateTreasureNodes()}
      </div>
      
      {/* 终点宝箱节点 - 替换原来的静态徽章，筛选模式下隐藏 */}
      {(() => {
        const originalProblems = allProblems || problems;
        // 筛选模式下不显示终点宝箱
        if (problems.length !== originalProblems.length) {
          return null;
        }
        
        const endpointPos = getEndpointTreasurePosition();
        return (
          <div
            className="path-treasure-wrapper endpoint-treasure"
            style={{
              left: `${endpointPos.xPercent}%`,
              top: endpointPos.yPosition - 40
            }}
          >
            <TreasureNode
              treasureId={`endpoint-${pathId}`}
              stageNumber={segmentInfo.segmentCount + 1}
              canOpen={allProblemsCompleted}
              currentLang={currentLang}
              onOpen={handleTreasureOpen}
              isEndpoint={true}
            />
          </div>
        );
      })()}
      
      {/* 设置弹窗 */}
      <ClickBehaviorSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLang={currentLang}
      />
    </div>
  );
};

export default DuolingoPath;
