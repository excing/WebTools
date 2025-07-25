import { browser } from '$app/environment';
import { trackEvent } from './analytics';

// A/B 测试变体类型
export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 权重，用于分配流量
  config: Record<string, any>; // 变体配置
}

// A/B 测试配置
export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  startDate: string;
  endDate?: string;
  variants: ABTestVariant[];
  targetAudience?: {
    percentage: number; // 参与测试的用户百分比
    conditions?: Record<string, any>; // 目标受众条件
  };
}

// 用户分组信息
export interface UserAssignment {
  testId: string;
  variantId: string;
  assignedAt: number;
  userId?: string;
}

// A/B 测试管理器
class ABTestManager {
  private assignments: Map<string, UserAssignment> = new Map();
  private tests: Map<string, ABTestConfig> = new Map();

  constructor() {
    if (browser) {
      this.loadAssignments();
      this.initializeTests();
    }
  }

  /**
   * 初始化测试配置
   */
  private initializeTests() {
    // 这里可以从服务器加载测试配置，现在使用硬编码的示例
    const exampleTests: ABTestConfig[] = [
      {
        id: 'homepage_cta_test',
        name: '首页CTA按钮测试',
        description: '测试不同的CTA按钮文案对点击率的影响',
        enabled: true,
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        variants: [
          {
            id: 'control',
            name: '控制组',
            weight: 50,
            config: {
              ctaText: '开始使用',
              ctaColor: 'blue'
            }
          },
          {
            id: 'variant_a',
            name: '变体A',
            weight: 50,
            config: {
              ctaText: '立即体验',
              ctaColor: 'green'
            }
          }
        ],
        targetAudience: {
          percentage: 100 // 100% 用户参与测试
        }
      },
      {
        id: 'uuid_tool_layout_test',
        name: 'UUID工具布局测试',
        description: '测试不同的UUID工具页面布局',
        enabled: true,
        startDate: '2025-01-01',
        variants: [
          {
            id: 'control',
            name: '当前布局',
            weight: 70,
            config: {
              layout: 'vertical',
              showDescription: true
            }
          },
          {
            id: 'variant_horizontal',
            name: '水平布局',
            weight: 30,
            config: {
              layout: 'horizontal',
              showDescription: false
            }
          }
        ],
        targetAudience: {
          percentage: 50 // 50% 用户参与测试
        }
      }
    ];

    exampleTests.forEach(test => {
      this.tests.set(test.id, test);
    });
  }

  /**
   * 从 localStorage 加载用户分组
   */
  private loadAssignments() {
    try {
      const saved = localStorage.getItem('abTestAssignments');
      if (saved) {
        const assignments = JSON.parse(saved);
        Object.entries(assignments).forEach(([testId, assignment]) => {
          this.assignments.set(testId, assignment as UserAssignment);
        });
      }
    } catch (error) {
      console.error('Failed to load AB test assignments:', error);
    }
  }

  /**
   * 保存用户分组到 localStorage
   */
  private saveAssignments() {
    try {
      const assignments: Record<string, UserAssignment> = {};
      this.assignments.forEach((assignment, testId) => {
        assignments[testId] = assignment;
      });
      localStorage.setItem('abTestAssignments', JSON.stringify(assignments));
    } catch (error) {
      console.error('Failed to save AB test assignments:', error);
    }
  }

  /**
   * 生成用户ID（基于浏览器指纹）
   */
  private generateUserId(): string {
    // 简单的浏览器指纹
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|');

    // 简单哈希
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * 检查用户是否符合目标受众条件
   */
  private isUserInTargetAudience(test: ABTestConfig, userId: string): boolean {
    if (!test.targetAudience) return true;

    // 基于用户ID的哈希值来决定是否参与测试
    const hash = this.hashString(userId + test.id);
    const percentage = (hash % 100) + 1;
    
    return percentage <= test.targetAudience.percentage;
  }

  /**
   * 简单的字符串哈希函数
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * 为用户分配测试变体
   */
  private assignVariant(test: ABTestConfig, userId: string): string {
    // 基于用户ID和测试ID的哈希值来分配变体
    const hash = this.hashString(userId + test.id);
    const totalWeight = test.variants.reduce((sum, variant) => sum + variant.weight, 0);
    const randomValue = hash % totalWeight;

    let currentWeight = 0;
    for (const variant of test.variants) {
      currentWeight += variant.weight;
      if (randomValue < currentWeight) {
        return variant.id;
      }
    }

    // 默认返回第一个变体
    return test.variants[0]?.id || 'control';
  }

  /**
   * 获取用户在指定测试中的变体
   */
  public getVariant(testId: string): string | null {
    if (!browser) return null;

    const test = this.tests.get(testId);
    if (!test || !test.enabled) return null;

    // 检查测试是否在有效期内
    const now = new Date();
    const startDate = new Date(test.startDate);
    if (now < startDate) return null;

    if (test.endDate) {
      const endDate = new Date(test.endDate);
      if (now > endDate) return null;
    }

    // 检查是否已有分组
    const existingAssignment = this.assignments.get(testId);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // 生成用户ID
    const userId = this.generateUserId();

    // 检查是否符合目标受众
    if (!this.isUserInTargetAudience(test, userId)) {
      return null;
    }

    // 分配变体
    const variantId = this.assignVariant(test, userId);
    
    // 保存分组
    const assignment: UserAssignment = {
      testId,
      variantId,
      assignedAt: Date.now(),
      userId
    };
    
    this.assignments.set(testId, assignment);
    this.saveAssignments();

    // 追踪分组事件
    trackEvent('ab_test_assignment', {
      test_id: testId,
      variant_id: variantId,
      user_id: userId
    });

    return variantId;
  }

  /**
   * 获取变体配置
   */
  public getVariantConfig(testId: string): Record<string, any> | null {
    const variantId = this.getVariant(testId);
    if (!variantId) return null;

    const test = this.tests.get(testId);
    if (!test) return null;

    const variant = test.variants.find(v => v.id === variantId);
    return variant?.config || null;
  }

  /**
   * 追踪转化事件
   */
  public trackConversion(testId: string, conversionType: string, value?: number) {
    const variantId = this.getVariant(testId);
    if (!variantId) return;

    trackEvent('ab_test_conversion', {
      test_id: testId,
      variant_id: variantId,
      conversion_type: conversionType,
      value: value || 1
    });
  }

  /**
   * 获取所有活跃的测试
   */
  public getActiveTests(): ABTestConfig[] {
    const now = new Date();
    return Array.from(this.tests.values()).filter(test => {
      if (!test.enabled) return false;
      
      const startDate = new Date(test.startDate);
      if (now < startDate) return false;
      
      if (test.endDate) {
        const endDate = new Date(test.endDate);
        if (now > endDate) return false;
      }
      
      return true;
    });
  }

  /**
   * 获取用户的所有测试分组
   */
  public getUserAssignments(): UserAssignment[] {
    return Array.from(this.assignments.values());
  }

  /**
   * 清除所有测试分组（用于调试）
   */
  public clearAssignments() {
    this.assignments.clear();
    localStorage.removeItem('abTestAssignments');
  }
}

// 导出单例实例
export const abTestManager = new ABTestManager();

// 便捷函数
export function getABTestVariant(testId: string): string | null {
  return abTestManager.getVariant(testId);
}

export function getABTestConfig(testId: string): Record<string, any> | null {
  return abTestManager.getVariantConfig(testId);
}

export function trackABTestConversion(testId: string, conversionType: string, value?: number) {
  abTestManager.trackConversion(testId, conversionType, value);
}
