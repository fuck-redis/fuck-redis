/**
 * 学习路径配置
 * 按照 Redis 数据结构类型分类，每个类型内部按难度从简单到困难排序
 */

export interface LearningPath {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  // 数据结构分类的category字段值
  categories: string[];
  // 难度顺序权重
  difficultyOrder: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
}

// 学习路径定义 - 使用更符合 Redis 数据结构风格的图标
export const learningPaths: LearningPath[] = [
  {
    id: 'string',
    name: '字符串',
    nameEn: 'String',
    description: 'SDS 简单动态字符串，掌握 Redis 字符串的底层实现',
    descriptionEn: 'SDS Simple Dynamic String, master Redis string implementation',
    icon: 'abc',  // 字符串图标
    color: '#52c41a',
    categories: ['字符串'],
    difficultyOrder: { EASY: 1, MEDIUM: 2, HARD: 3 }
  },
  {
    id: 'hash-table',
    name: '哈希表',
    nameEn: 'Hash Table',
    description: 'Dict 字典，理解 Redis 哈希表的实现原理',
    descriptionEn: 'Dict Dictionary, understand Redis hash table implementation',
    icon: '{ }',  // 花括号代表键值对/哈希映射
    color: '#1890ff',
    categories: ['哈希表'],
    difficultyOrder: { EASY: 1, MEDIUM: 2, HARD: 3 }
  },
  {
    id: 'list',
    name: '列表',
    nameEn: 'List',
    description: 'Ziplist 和 Quicklist，理解列表的压缩存储和链表实现',
    descriptionEn: 'Ziplist and Quicklist, understand list compression and linked list',
    icon: '[ ]',  // 方括号代表列表
    color: '#722ed1',
    categories: ['列表'],
    difficultyOrder: { EASY: 1, MEDIUM: 2, HARD: 3 }
  },
  {
    id: 'set',
    name: '集合',
    nameEn: 'Set',
    description: 'Intset 整数集合和 Dict 集合，理解集合的高效存储',
    descriptionEn: 'Intset and Dict Set, understand efficient set storage',
    icon: '{*}',  // 集合符号
    color: '#fa8c16',
    categories: ['集合'],
    difficultyOrder: { EASY: 1, MEDIUM: 2, HARD: 3 }
  },
  {
    id: 'sorted-set',
    name: '有序集合',
    nameEn: 'Sorted Set',
    description: 'SkipList 跳跃表，理解有序集合的排序原理',
    descriptionEn: 'SkipList, understand sorted set ordering',
    icon: '{★}',  // 有序集合符号
    color: '#13c2c2',
    categories: ['有序集合'],
    difficultyOrder: { EASY: 1, MEDIUM: 2, HARD: 3 }
  },
  {
    id: 'advanced',
    name: '高级数据结构',
    nameEn: 'Advanced Structures',
    description: 'HyperLogLog、Bitmap、Geospatial、Stream 等高级数据结构',
    descriptionEn: 'HyperLogLog, Bitmap, Geospatial, Stream and more',
    icon: '◆',  // 高级符号
    color: '#eb2f96',
    categories: ['高级数据结构'],
    difficultyOrder: { EASY: 1, MEDIUM: 2, HARD: 3 }
  },
  {
    id: 'object',
    name: '对象系统',
    nameEn: 'Object System',
    description: 'Redis Object 对象结构，理解类型与编码',
    descriptionEn: 'Redis Object structure, understand types and encodings',
    icon: '○',  // 对象符号
    color: '#f5222d',
    categories: ['对象'],
    difficultyOrder: { EASY: 1, MEDIUM: 2, HARD: 3 }
  }
];

// 获取数据结构所属的学习路径
export const getPathForProblem = (category: string | undefined): LearningPath | undefined => {
  if (!category) return undefined;
  return learningPaths.find(path => path.categories.includes(category));
};

// 获取难度排序权重
export const getDifficultyWeight = (difficulty: 'EASY' | 'MEDIUM' | 'HARD'): number => {
  const weights = { EASY: 1, MEDIUM: 2, HARD: 3 };
  return weights[difficulty] || 2;
};
