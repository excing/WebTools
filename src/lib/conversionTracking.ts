import { browser } from '$app/environment';
import { trackEvent } from './analytics';
import { trackABTestConversion } from './abTesting';

// 转化事件类型
export interface ConversionEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

// 转化漏斗步骤
export interface FunnelStep {
  id: string;
  name: string;
  order: number;
  required: boolean;
}

// 转化漏斗配置
export interface ConversionFunnel {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
}

// 用户转化会话
export interface ConversionSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  completedSteps: Set<string>;
  conversions: ConversionEvent[];
  metadata: Record<string, any>;
}

// 转化追踪管理器
class ConversionTracker {
  private session: ConversionSession | null = null;
  private funnels: Map<string, ConversionFunnel> = new Map();
  private goals: Map<string, ConversionEvent> = new Map();

  constructor() {
    if (browser) {
      this.initializeSession();
      this.setupFunnels();
      this.setupGoals();
    }
  }

  /**
   * 初始化转化会话
   */
  private initializeSession() {
    const sessionId = this.generateSessionId();
    
    this.session = {
      sessionId,
      startTime: Date.now(),
      completedSteps: new Set(),
      conversions: [],
      metadata: {}
    };

    // 尝试从 localStorage 恢复会话
    try {
      const saved = localStorage.getItem('conversionSession');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 如果会话在24小时内，则恢复
        if (Date.now() - parsed.startTime < 24 * 60 * 60 * 1000) {
          this.session = {
            ...parsed,
            completedSteps: new Set(parsed.completedSteps)
          };
        }
      }
    } catch (error) {
      console.error('Failed to restore conversion session:', error);
    }

    this.saveSession();
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存会话到 localStorage
   */
  private saveSession() {
    if (!this.session) return;

    try {
      const sessionData = {
        ...this.session,
        completedSteps: Array.from(this.session.completedSteps)
      };
      localStorage.setItem('conversionSession', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save conversion session:', error);
    }
  }

  /**
   * 设置转化漏斗
   */
  private setupFunnels() {
    const funnels: ConversionFunnel[] = [
      {
        id: 'tool_usage_funnel',
        name: '工具使用漏斗',
        description: '从访问首页到使用工具的完整流程',
        steps: [
          { id: 'homepage_visit', name: '访问首页', order: 1, required: true },
          { id: 'tool_page_visit', name: '访问工具页面', order: 2, required: true },
          { id: 'tool_interaction', name: '与工具交互', order: 3, required: true },
          { id: 'tool_success', name: '成功使用工具', order: 4, required: false }
        ]
      },
      {
        id: 'auth_funnel',
        name: '认证流程漏斗',
        description: '从访问认证页面到成功登录的流程',
        steps: [
          { id: 'auth_page_visit', name: '访问认证页面', order: 1, required: true },
          { id: 'auth_attempt', name: '尝试认证', order: 2, required: true },
          { id: 'auth_success', name: '认证成功', order: 3, required: false }
        ]
      },
      {
        id: 'fcm_setup_funnel',
        name: 'FCM设置漏斗',
        description: '从访问FCM页面到成功设置推送的流程',
        steps: [
          { id: 'fcm_page_visit', name: '访问FCM页面', order: 1, required: true },
          { id: 'permission_request', name: '请求通知权限', order: 2, required: true },
          { id: 'permission_granted', name: '权限授予', order: 3, required: true },
          { id: 'message_sent', name: '发送消息', order: 4, required: false }
        ]
      }
    ];

    funnels.forEach(funnel => {
      this.funnels.set(funnel.id, funnel);
    });
  }

  /**
   * 设置转化目标
   */
  private setupGoals() {
    const goals: ConversionEvent[] = [
      {
        id: 'uuid_generated',
        name: 'UUID生成',
        description: '用户成功生成UUID',
        category: 'tool_usage',
        value: 1
      },
      {
        id: 'uuid_copied',
        name: 'UUID复制',
        description: '用户复制生成的UUID',
        category: 'tool_usage',
        value: 2
      },
      {
        id: 'google_auth_success',
        name: 'Google认证成功',
        description: '用户成功通过Google认证',
        category: 'authentication',
        value: 5
      },
      {
        id: 'email_auth_success',
        name: '邮件认证成功',
        description: '用户成功通过邮件认证',
        category: 'authentication',
        value: 5
      },
      {
        id: 'fcm_permission_granted',
        name: 'FCM权限授予',
        description: '用户授予FCM通知权限',
        category: 'engagement',
        value: 3
      },
      {
        id: 'fcm_message_sent',
        name: 'FCM消息发送',
        description: '用户成功发送FCM消息',
        category: 'engagement',
        value: 4
      }
    ];

    goals.forEach(goal => {
      this.goals.set(goal.id, goal);
    });
  }

  /**
   * 追踪漏斗步骤完成
   */
  public trackFunnelStep(funnelId: string, stepId: string, metadata?: Record<string, any>) {
    if (!this.session) return;

    const funnel = this.funnels.get(funnelId);
    if (!funnel) return;

    const step = funnel.steps.find(s => s.id === stepId);
    if (!step) return;

    // 记录步骤完成
    this.session.completedSteps.add(`${funnelId}:${stepId}`);
    
    // 更新会话元数据
    if (metadata) {
      this.session.metadata[`${funnelId}:${stepId}`] = {
        ...metadata,
        timestamp: Date.now()
      };
    }

    this.saveSession();

    // 追踪事件
    trackEvent('funnel_step_completed', {
      funnel_id: funnelId,
      step_id: stepId,
      step_name: step.name,
      step_order: step.order,
      session_id: this.session.sessionId,
      ...metadata
    });

    // 检查漏斗完成情况
    this.checkFunnelCompletion(funnelId);
  }

  /**
   * 检查漏斗完成情况
   */
  private checkFunnelCompletion(funnelId: string) {
    if (!this.session) return;

    const funnel = this.funnels.get(funnelId);
    if (!funnel) return;

    const completedSteps = funnel.steps.filter(step => 
      this.session!.completedSteps.has(`${funnelId}:${step.id}`)
    );

    const requiredSteps = funnel.steps.filter(step => step.required);
    const completedRequiredSteps = requiredSteps.filter(step => 
      this.session!.completedSteps.has(`${funnelId}:${step.id}`)
    );

    // 检查是否完成了所有必需步骤
    if (completedRequiredSteps.length === requiredSteps.length) {
      trackEvent('funnel_completed', {
        funnel_id: funnelId,
        funnel_name: funnel.name,
        total_steps: funnel.steps.length,
        completed_steps: completedSteps.length,
        completion_rate: completedSteps.length / funnel.steps.length,
        session_id: this.session.sessionId
      });
    }

    // 追踪漏斗进度
    trackEvent('funnel_progress', {
      funnel_id: funnelId,
      progress: completedSteps.length / funnel.steps.length,
      completed_required: completedRequiredSteps.length,
      total_required: requiredSteps.length,
      session_id: this.session.sessionId
    });
  }

  /**
   * 追踪转化目标完成
   */
  public trackConversion(goalId: string, metadata?: Record<string, any>) {
    if (!this.session) return;

    const goal = this.goals.get(goalId);
    if (!goal) return;

    // 创建转化事件
    const conversion: ConversionEvent = {
      ...goal,
      metadata: {
        ...goal.metadata,
        ...metadata,
        timestamp: Date.now(),
        sessionId: this.session.sessionId
      }
    };

    this.session.conversions.push(conversion);
    this.saveSession();

    // 追踪转化事件
    trackEvent('conversion', {
      goal_id: goalId,
      goal_name: goal.name,
      category: goal.category,
      value: goal.value,
      session_id: this.session.sessionId,
      ...metadata
    });

    // 追踪A/B测试转化（如果适用）
    const abTestIds = ['homepage_cta_test', 'uuid_tool_layout_test'];
    abTestIds.forEach(testId => {
      trackABTestConversion(testId, goalId, goal.value);
    });
  }

  /**
   * 获取漏斗完成情况
   */
  public getFunnelProgress(funnelId: string): { completed: number; total: number; steps: any[] } | null {
    if (!this.session) return null;

    const funnel = this.funnels.get(funnelId);
    if (!funnel) return null;

    const steps = funnel.steps.map(step => ({
      ...step,
      completed: this.session!.completedSteps.has(`${funnelId}:${step.id}`),
      metadata: this.session!.metadata[`${funnelId}:${step.id}`]
    }));

    const completed = steps.filter(step => step.completed).length;

    return {
      completed,
      total: steps.length,
      steps
    };
  }

  /**
   * 获取会话转化情况
   */
  public getSessionConversions(): ConversionEvent[] {
    return this.session?.conversions || [];
  }

  /**
   * 清除会话数据
   */
  public clearSession() {
    this.session = null;
    localStorage.removeItem('conversionSession');
    this.initializeSession();
  }
}

// 导出单例实例
export const conversionTracker = new ConversionTracker();

// 便捷函数
export function trackFunnelStep(funnelId: string, stepId: string, metadata?: Record<string, any>) {
  conversionTracker.trackFunnelStep(funnelId, stepId, metadata);
}

export function trackConversionGoal(goalId: string, metadata?: Record<string, any>) {
  conversionTracker.trackConversion(goalId, metadata);
}
