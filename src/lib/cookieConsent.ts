/**
 * Cookie同意管理系统
 * 符合GDPR规范的cookie分类和用户同意管理
 */

import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Cookie分类定义
export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  cookies: CookieInfo[];
}

// Cookie信息定义
export interface CookieInfo {
  name: string;
  purpose: string;
  duration: string;
  provider: string;
  type: 'first-party' | 'third-party';
}

// 用户同意状态
export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: number;
  version: string;
}

// Cookie分类配置
export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    name: '必要Cookie',
    description: '这些Cookie对于网站的基本功能是必需的，无法禁用。它们通常仅在您进行操作时设置，例如设置隐私偏好、登录或填写表单。',
    required: true,
    enabled: true,
    cookies: [
      {
        name: 'consent-preferences',
        purpose: '存储用户的Cookie同意偏好',
        duration: '1年',
        provider: 'WebTools',
        type: 'first-party'
      },
      {
        name: 'session-id',
        purpose: '维护用户会话状态',
        duration: '会话结束',
        provider: 'WebTools',
        type: 'first-party'
      }
    ]
  },
  {
    id: 'analytics',
    name: '分析Cookie',
    description: '这些Cookie帮助我们了解访问者如何与网站互动，收集和报告信息以改善网站性能。所有信息都是匿名的。',
    required: false,
    enabled: false,
    cookies: [
      {
        name: '_ga',
        purpose: 'Google Analytics - 区分用户',
        duration: '2年',
        provider: 'Google',
        type: 'third-party'
      },
      {
        name: '_ga_*',
        purpose: 'Google Analytics 4 - 会话和用户识别',
        duration: '2年',
        provider: 'Google',
        type: 'third-party'
      },
      {
        name: 'user-behavior-session',
        purpose: '用户行为分析和会话追踪',
        duration: '30天',
        provider: 'WebTools',
        type: 'first-party'
      },
      {
        name: 'ab-test-assignments',
        purpose: 'A/B测试分组信息',
        duration: '90天',
        provider: 'WebTools',
        type: 'first-party'
      }
    ]
  },
  {
    id: 'marketing',
    name: '营销Cookie',
    description: '这些Cookie用于跟踪访问者在网站上的活动，目的是显示相关和有吸引力的广告。',
    required: false,
    enabled: false,
    cookies: [
      {
        name: 'conversion-tracking',
        purpose: '转化追踪和营销效果分析',
        duration: '30天',
        provider: 'WebTools',
        type: 'first-party'
      }
    ]
  },
  {
    id: 'preferences',
    name: '偏好Cookie',
    description: '这些Cookie使网站能够记住改变网站行为或外观的选择，如您的首选语言或您所在的地区。',
    required: false,
    enabled: false,
    cookies: [
      {
        name: 'user-preferences',
        purpose: '用户界面偏好设置',
        duration: '1年',
        provider: 'WebTools',
        type: 'first-party'
      },
      {
        name: 'theme-preference',
        purpose: '主题和显示偏好',
        duration: '1年',
        provider: 'WebTools',
        type: 'first-party'
      }
    ]
  }
];

// 当前同意政策版本
export const CONSENT_VERSION = '1.0.0';

// 存储键名
const CONSENT_STORAGE_KEY = 'cookie-consent';
const BANNER_DISMISSED_KEY = 'cookie-banner-dismissed';

class CookieConsentManager {
  private consentState: ConsentState | null = null;
  private categories: CookieCategory[] = [...COOKIE_CATEGORIES];

  constructor() {
    if (browser) {
      this.loadConsentState();
    }
  }

  /**
   * 加载用户同意状态
   */
  public loadConsentState(): void {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 检查版本是否匹配
        if (parsed.version === CONSENT_VERSION) {
          this.consentState = parsed;
          this.updateCategoriesFromConsent();
        } else {
          // 版本不匹配，清除旧的同意状态
          this.clearConsentState();
        }
      }
    } catch (error) {
      console.error('Failed to load consent state:', error);
      this.clearConsentState();
    }
  }

  /**
   * 保存用户同意状态
   */
  private saveConsentState(): void {
    if (!browser || !this.consentState) return;

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(this.consentState));
      // 触发存储事件，通知其他标签页
      window.dispatchEvent(new StorageEvent('storage', {
        key: CONSENT_STORAGE_KEY,
        newValue: JSON.stringify(this.consentState)
      }));
    } catch (error) {
      console.error('Failed to save consent state:', error);
    }
  }

  /**
   * 根据同意状态更新分类
   */
  private updateCategoriesFromConsent(): void {
    if (!this.consentState) return;

    this.categories.forEach(category => {
      if (category.required) {
        category.enabled = true;
      } else {
        category.enabled = this.consentState![category.id as keyof ConsentState] as boolean;
      }
    });
  }

  /**
   * 清除同意状态
   */
  private clearConsentState(): void {
    this.consentState = null;
    if (browser) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      localStorage.removeItem(BANNER_DISMISSED_KEY);
    }
  }

  /**
   * 检查是否已获得同意
   */
  public hasConsent(): boolean {
    return this.consentState !== null;
  }

  /**
   * 检查特定分类是否已同意
   */
  public hasConsentForCategory(categoryId: string): boolean {
    if (!this.consentState) return false;
    
    const category = this.categories.find(c => c.id === categoryId);
    if (category?.required) return true;
    
    return this.consentState[categoryId as keyof ConsentState] as boolean || false;
  }

  /**
   * 获取当前同意状态
   */
  public getConsentState(): ConsentState | null {
    return this.consentState;
  }

  /**
   * 获取Cookie分类
   */
  public getCategories(): CookieCategory[] {
    return [...this.categories];
  }

  /**
   * 设置同意状态
   */
  public setConsent(consent: Partial<ConsentState>): void {
    this.consentState = {
      necessary: true, // 必要Cookie始终为true
      analytics: consent.analytics || false,
      marketing: consent.marketing || false,
      preferences: consent.preferences || false,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };

    this.updateCategoriesFromConsent();
    this.saveConsentState();
    this.dismissBanner();

    // 触发同意状态变更事件
    if (browser) {
      window.dispatchEvent(new CustomEvent('consentChanged', {
        detail: this.consentState
      }));
    }
  }

  /**
   * 接受所有Cookie
   */
  public acceptAll(): void {
    this.setConsent({
      analytics: true,
      marketing: true,
      preferences: true
    });
  }

  /**
   * 拒绝所有非必要Cookie
   */
  public rejectAll(): void {
    this.setConsent({
      analytics: false,
      marketing: false,
      preferences: false
    });
  }

  /**
   * 检查是否应显示横幅
   */
  public shouldShowBanner(): boolean {
    if (!browser) return false;
    
    // 如果已有同意状态且版本匹配，不显示横幅
    if (this.hasConsent()) return false;
    
    // 检查是否已手动关闭横幅
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    return !dismissed;
  }

  /**
   * 关闭横幅（不保存同意状态）
   */
  public dismissBanner(): void {
    if (browser) {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  }

  /**
   * 重置所有状态（用于测试）
   */
  public reset(): void {
    this.clearConsentState();
    this.categories = [...COOKIE_CATEGORIES];
  }
}

// 导出单例实例
export const cookieConsentManager = new CookieConsentManager();

// Svelte stores
export const consentState = writable<ConsentState | null>(cookieConsentManager.getConsentState());
export const showBanner = writable<boolean>(cookieConsentManager.shouldShowBanner());

// 监听同意状态变更
if (browser) {
  window.addEventListener('consentChanged', (event: CustomEvent) => {
    consentState.set(event.detail);
  });

  // 监听存储变更（跨标签页同步）
  window.addEventListener('storage', (event) => {
    if (event.key === CONSENT_STORAGE_KEY) {
      cookieConsentManager.loadConsentState();
      consentState.set(cookieConsentManager.getConsentState());
    }
  });
}

// 便捷函数
export function hasConsent(): boolean {
  return cookieConsentManager.hasConsent();
}

export function hasConsentForCategory(categoryId: string): boolean {
  return cookieConsentManager.hasConsentForCategory(categoryId);
}

export function acceptAllCookies(): void {
  cookieConsentManager.acceptAll();
  showBanner.set(false);
}

export function rejectAllCookies(): void {
  cookieConsentManager.rejectAll();
  showBanner.set(false);
}

export function setCustomConsent(consent: Partial<ConsentState>): void {
  cookieConsentManager.setConsent(consent);
  showBanner.set(false);
}
