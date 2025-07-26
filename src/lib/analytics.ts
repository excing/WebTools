import { browser } from "$app/environment";
import { fireapp, initAnalytics } from "./firebase.js";
import { logEvent, type Analytics } from "firebase/analytics";
import { hasConsentForCategory } from "./cookieConsent";

// Analytics 事件类型定义
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

// 页面浏览事件参数
export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
}

// 自定义事件参数
export interface CustomEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: any;
}

class AnalyticsManager {
  private analytics: Analytics | null = null;
  private initialized = false;
  private eventQueue: AnalyticsEvent[] = [];

  /**
   * 初始化 Analytics
   */
  async init(): Promise<void> {
    if (!browser || this.initialized) return;

    // 检查是否有分析Cookie的同意
    if (!hasConsentForCategory('analytics')) {
      console.log("Analytics initialization skipped: no consent for analytics cookies");
      return;
    }

    try {
      // 先初始化 Firebase
      fireapp();

      // 然后初始化 Analytics
      this.analytics = await initAnalytics();

      if (this.analytics) {
        this.initialized = true;

        // 处理队列中的事件
        this.processEventQueue();

        console.log("Analytics initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize Analytics:", error);
    }
  }

  /**
   * 处理事件队列
   */
  private processEventQueue(): void {
    if (!this.analytics) return;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEvent(event.name, event.parameters);
      }
    }
  }

  /**
   * 追踪页面浏览
   */
  trackPageView(params: PageViewEvent): void {
    this.trackEvent("page_view", {
      page_title: params.page_title,
      page_location: params.page_location,
      page_path: params.page_path,
    });
  }

  /**
   * 追踪自定义事件
   */
  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    if (!browser) return;

    // 检查是否有分析Cookie的同意
    if (!hasConsentForCategory('analytics')) {
      console.log(`Analytics event skipped: ${eventName} (no consent for analytics cookies)`);
      return;
    }

    if (!this.analytics || !this.initialized) {
      // 如果 Analytics 未初始化，将事件加入队列
      this.eventQueue.push({ name: eventName, parameters });
      return;
    }

    try {
      logEvent(this.analytics, eventName, parameters);
      console.log(`Analytics event tracked: ${eventName}`, parameters);
    } catch (error) {
      console.error(`Failed to track event ${eventName}:`, error);
    }
  }

  /**
   * 追踪用户交互事件
   */
  trackUserInteraction(action: string, element: string, label?: string): void {
    this.trackEvent("user_interaction", {
      event_category: "engagement",
      action,
      element,
      label,
    });
  }

  /**
   * 追踪工具使用事件
   */
  trackToolUsage(toolName: string, action: string, details?: Record<string, any>): void {
    this.trackEvent("tool_usage", {
      event_category: "tools",
      tool_name: toolName,
      action,
      ...details,
    });
  }

  /**
   * 追踪认证事件
   */
  trackAuthEvent(action: string, method?: string, success?: boolean): void {
    this.trackEvent("auth_event", {
      event_category: "authentication",
      action,
      method,
      success,
    });
  }

  /**
   * 追踪错误事件
   */
  trackError(error: string, context?: string, fatal?: boolean): void {
    this.trackEvent("exception", {
      description: error,
      context,
      fatal: fatal || false,
    });
  }

  /**
   * 追踪性能指标
   */
  trackPerformance(metric: string, value: number, unit?: string): void {
    this.trackEvent("performance_metric", {
      event_category: "performance",
      metric_name: metric,
      metric_value: value,
      unit,
    });
  }

  /**
   * 追踪搜索事件
   */
  trackSearch(searchTerm: string, results?: number): void {
    this.trackEvent("search", {
      search_term: searchTerm,
      results_count: results,
    });
  }

  /**
   * 追踪文件下载
   */
  trackDownload(fileName: string, fileType?: string): void {
    this.trackEvent("file_download", {
      event_category: "downloads",
      file_name: fileName,
      file_type: fileType,
    });
  }

  /**
   * 追踪外部链接点击
   */
  trackExternalLink(url: string, linkText?: string): void {
    this.trackEvent("click", {
      event_category: "outbound_links",
      link_url: url,
      link_text: linkText,
    });
  }

  /**
   * 设置用户属性
   */
  setUserProperty(propertyName: string, value: string): void {
    if (!this.analytics || !this.initialized) return;

    try {
      // Firebase Analytics 用户属性设置
      // 注意：用户属性名称有限制，需要符合 Firebase 规范
      this.trackEvent("user_property_set", {
        property_name: propertyName,
        property_value: value,
      });
    } catch (error) {
      console.error(`Failed to set user property ${propertyName}:`, error);
    }
  }

  /**
   * 获取初始化状态
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 重新初始化Analytics（当用户同意后调用）
   */
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.analytics = null;
    await this.init();
  }

  /**
   * 禁用Analytics（当用户撤回同意后调用）
   */
  disable(): void {
    this.initialized = false;
    this.analytics = null;
    this.eventQueue = [];
    console.log("Analytics disabled due to consent withdrawal");
  }
}

// 创建全局实例
export const analytics = new AnalyticsManager();

// 便捷函数导出
export const trackPageView = (params: PageViewEvent) => analytics.trackPageView(params);
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => 
  analytics.trackEvent(eventName, parameters);
export const trackUserInteraction = (action: string, element: string, label?: string) => 
  analytics.trackUserInteraction(action, element, label);
export const trackToolUsage = (toolName: string, action: string, details?: Record<string, any>) => 
  analytics.trackToolUsage(toolName, action, details);
export const trackAuthEvent = (action: string, method?: string, success?: boolean) => 
  analytics.trackAuthEvent(action, method, success);
export const trackError = (error: string, context?: string, fatal?: boolean) => 
  analytics.trackError(error, context, fatal);
export const trackPerformance = (metric: string, value: number, unit?: string) => 
  analytics.trackPerformance(metric, value, unit);

// 初始化 Analytics（在模块加载时）
if (browser) {
  analytics.init();
}
