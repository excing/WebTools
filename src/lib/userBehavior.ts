import { browser } from '$app/environment';
import { trackUserInteraction, trackPerformance } from './analytics';

// 用户行为追踪类型
export interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  interactions: number;
  scrollDepth: number;
  timeOnPage: number;
}

// 滚动深度追踪
export interface ScrollDepthEvent {
  depth: number;
  timestamp: number;
  page: string;
}

// 点击热力图数据
export interface ClickHeatmapData {
  x: number;
  y: number;
  timestamp: number;
  element: string;
  page: string;
}

// 用户会话管理
class UserBehaviorTracker {
  private session: UserSession | null = null;
  private scrollDepthThresholds = [25, 50, 75, 90, 100];
  private trackedScrollDepths = new Set<number>();
  private lastScrollTime = 0;
  private scrollTimeout: number | null = null;
  private idleTimeout: number | null = null;
  private isIdle = false;

  constructor() {
    if (browser) {
      this.initSession();
      this.setupEventListeners();
    }
  }

  /**
   * 初始化用户会话
   */
  private initSession() {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    this.session = {
      sessionId,
      startTime: now,
      lastActivity: now,
      pageViews: 0,
      interactions: 0,
      scrollDepth: 0,
      timeOnPage: 0
    };

    // 从 localStorage 恢复会话（如果存在且未过期）
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // 如果会话在30分钟内，则恢复
        if (now - parsed.lastActivity < 30 * 60 * 1000) {
          this.session = { ...parsed, lastActivity: now };
        }
      } catch (error) {
        console.error('Failed to parse saved session:', error);
      }
    }

    this.saveSession();
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存会话到 localStorage
   */
  private saveSession() {
    if (this.session) {
      localStorage.setItem('userSession', JSON.stringify(this.session));
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    if (!browser) return;

    // 滚动追踪
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // 点击追踪
    document.addEventListener('click', this.handleClick.bind(this), true);

    // 键盘交互追踪
    document.addEventListener('keydown', this.handleKeydown.bind(this));

    // 鼠标移动追踪（用于检测用户活跃度）
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });

    // 页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // 页面卸载时保存数据
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // 窗口焦点变化
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
  }

  /**
   * 处理滚动事件
   */
  private handleScroll() {
    if (!this.session) return;

    const now = Date.now();
    this.lastScrollTime = now;
    this.updateActivity();

    // 防抖处理
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = window.setTimeout(() => {
      this.calculateScrollDepth();
    }, 100);
  }

  /**
   * 计算滚动深度
   */
  private calculateScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollPercent = Math.round((scrollTop + windowHeight) / documentHeight * 100);
    
    if (this.session) {
      this.session.scrollDepth = Math.max(this.session.scrollDepth, scrollPercent);
    }

    // 追踪滚动深度里程碑
    this.scrollDepthThresholds.forEach(threshold => {
      if (scrollPercent >= threshold && !this.trackedScrollDepths.has(threshold)) {
        this.trackedScrollDepths.add(threshold);
        trackUserInteraction('scroll', 'depth_reached', `${threshold}%`);
        trackPerformance(`scroll_depth_${threshold}`, Date.now() - this.lastScrollTime, 'ms');
      }
    });

    this.saveSession();
  }

  /**
   * 处理点击事件
   */
  private handleClick(event: MouseEvent) {
    if (!this.session) return;

    this.updateActivity();
    this.session.interactions++;

    const target = event.target as HTMLElement;
    const elementInfo = this.getElementInfo(target);

    // 记录点击热力图数据
    const clickData: ClickHeatmapData = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      element: elementInfo,
      page: window.location.pathname
    };

    // 追踪点击事件
    trackUserInteraction('click', 'element', elementInfo);

    // 保存点击热力图数据（可选）
    this.saveClickHeatmapData(clickData);
    this.saveSession();
  }

  /**
   * 获取元素信息
   */
  private getElementInfo(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent?.slice(0, 50) || '';
    
    return `${tagName}${id}${className}${text ? `[${text}]` : ''}`;
  }

  /**
   * 保存点击热力图数据
   */
  private saveClickHeatmapData(data: ClickHeatmapData) {
    const heatmapData = JSON.parse(localStorage.getItem('clickHeatmap') || '[]');
    heatmapData.push(data);
    
    // 只保留最近1000个点击
    if (heatmapData.length > 1000) {
      heatmapData.splice(0, heatmapData.length - 1000);
    }
    
    localStorage.setItem('clickHeatmap', JSON.stringify(heatmapData));
  }

  /**
   * 处理键盘事件
   */
  private handleKeydown(event: KeyboardEvent) {
    if (!this.session) return;

    this.updateActivity();
    this.session.interactions++;

    // 追踪特殊按键
    if (['Enter', 'Tab', 'Escape'].includes(event.key)) {
      trackUserInteraction('keydown', 'special_key', event.key);
    }

    this.saveSession();
  }

  /**
   * 处理鼠标移动
   */
  private handleMouseMove() {
    this.updateActivity();
    this.resetIdleTimer();
  }

  /**
   * 更新用户活动时间
   */
  private updateActivity() {
    if (this.session) {
      this.session.lastActivity = Date.now();
      this.isIdle = false;
    }
  }

  /**
   * 重置空闲计时器
   */
  private resetIdleTimer() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = window.setTimeout(() => {
      this.isIdle = true;
      trackUserInteraction('idle', 'user_idle', '5min');
    }, 5 * 60 * 1000); // 5分钟无活动视为空闲
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange() {
    if (document.hidden) {
      trackUserInteraction('visibility', 'page_hidden', window.location.pathname);
    } else {
      trackUserInteraction('visibility', 'page_visible', window.location.pathname);
      this.updateActivity();
    }
  }

  /**
   * 处理页面卸载
   */
  private handleBeforeUnload() {
    if (this.session) {
      this.session.timeOnPage = Date.now() - this.session.startTime;
      this.saveSession();
      
      // 发送会话数据
      trackPerformance('session_duration', this.session.timeOnPage, 'ms');
      trackPerformance('session_interactions', this.session.interactions);
      trackPerformance('session_scroll_depth', this.session.scrollDepth, '%');
    }
  }

  /**
   * 处理窗口获得焦点
   */
  private handleFocus() {
    trackUserInteraction('focus', 'window_focus', window.location.pathname);
    this.updateActivity();
  }

  /**
   * 处理窗口失去焦点
   */
  private handleBlur() {
    trackUserInteraction('focus', 'window_blur', window.location.pathname);
  }

  /**
   * 记录页面访问
   */
  public trackPageView(path: string) {
    if (this.session) {
      this.session.pageViews++;
      this.updateActivity();
      this.saveSession();
    }

    // 重置滚动深度追踪
    this.trackedScrollDepths.clear();
    
    trackUserInteraction('navigation', 'page_view', path);
  }

  /**
   * 获取当前会话信息
   */
  public getSession(): UserSession | null {
    return this.session;
  }

  /**
   * 获取点击热力图数据
   */
  public getClickHeatmapData(): ClickHeatmapData[] {
    return JSON.parse(localStorage.getItem('clickHeatmap') || '[]');
  }

  /**
   * 清除会话数据
   */
  public clearSession() {
    this.session = null;
    localStorage.removeItem('userSession');
    localStorage.removeItem('clickHeatmap');
  }
}

// 导出单例实例
export const userBehaviorTracker = new UserBehaviorTracker();
