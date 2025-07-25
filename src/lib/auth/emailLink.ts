import { 
  sendSignInLinkToEmail, 
  signInWithEmailLink, 
  isSignInWithEmailLink,
  type Auth,
  type ActionCodeSettings 
} from 'firebase/auth';

/**
 * 邮件链接认证工具类
 */
export class EmailLinkAuth {
  private auth: Auth;
  private storageKey = 'emailForSignIn';

  constructor(auth: Auth) {
    this.auth = auth;
  }

  /**
   * 发送登录链接到邮箱
   * @param email 邮箱地址
   * @param redirectUrl 重定向 URL（可选）
   * @returns Promise<void>
   */
  async sendLoginLink(email: string, redirectUrl?: string): Promise<void> {
    // 验证邮箱格式
    if (!this.isValidEmail(email)) {
      throw new Error('邮箱地址格式无效');
    }

    const actionCodeSettings: ActionCodeSettings = {
      url: redirectUrl || `${window.location.origin}/ft/auth/email`,
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.example.webtools'
      },
      android: {
        packageName: 'com.example.webtools',
        installApp: true,
        minimumVersion: '12'
      }
    };

    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    
    // 保存邮箱到本地存储
    this.saveEmailToStorage(email);
  }

  /**
   * 验证邮件链接并完成登录
   * @param url 当前页面 URL（可选，默认使用 window.location.href）
   * @param email 邮箱地址（可选，会尝试从本地存储获取）
   * @returns Promise<User>
   */
  async verifyAndSignIn(url?: string, email?: string) {
    const currentUrl = url || window.location.href;
    
    // 检查是否为有效的登录链接
    if (!isSignInWithEmailLink(this.auth, currentUrl)) {
      throw new Error('无效的邮件登录链接');
    }

    // 获取邮箱地址
    const emailForSignIn = email || this.getEmailFromStorage();
    
    if (!emailForSignIn) {
      throw new Error('需要邮箱地址才能完成登录');
    }

    // 使用邮件链接登录
    const result = await signInWithEmailLink(this.auth, emailForSignIn, currentUrl);
    
    // 清除本地存储的邮箱
    this.clearEmailFromStorage();
    
    return result.user;
  }

  /**
   * 检查当前 URL 是否为邮件登录链接
   * @param url 要检查的 URL（可选，默认使用 window.location.href）
   * @returns boolean
   */
  isEmailLink(url?: string): boolean {
    const currentUrl = url || window.location.href;
    return isSignInWithEmailLink(this.auth, currentUrl);
  }

  /**
   * 保存邮箱到本地存储
   * @param email 邮箱地址
   */
  private saveEmailToStorage(email: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, email);
    }
  }

  /**
   * 从本地存储获取邮箱
   * @returns string | null
   */
  private getEmailFromStorage(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.storageKey);
    }
    return null;
  }

  /**
   * 清除本地存储的邮箱
   */
  private clearEmailFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * 验证邮箱格式
   * @param email 邮箱地址
   * @returns boolean
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * 获取错误信息的友好提示
   * @param error Firebase 错误对象
   * @returns string
   */
  static getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/invalid-email':
        return '邮箱地址格式无效';
      case 'auth/user-disabled':
        return '该用户账户已被禁用';
      case 'auth/too-many-requests':
        return '请求过于频繁，请稍后再试';
      case 'auth/network-request-failed':
        return '网络连接失败，请检查网络后重试';
      case 'auth/invalid-action-code':
        return '登录链接无效或已过期';
      case 'auth/expired-action-code':
        return '登录链接已过期，请重新发送';
      case 'auth/invalid-continue-uri':
        return '重定向链接配置错误';
      case 'auth/unauthorized-continue-uri':
        return '重定向链接未授权';
      default:
        return error.message || '未知错误';
    }
  }
}

/**
 * 邮件链接认证状态枚举
 */
export enum EmailLinkAuthState {
  IDLE = 'idle',
  SENDING = 'sending',
  SENT = 'sent',
  VERIFYING = 'verifying',
  VERIFIED = 'verified',
  ERROR = 'error'
}

/**
 * 邮件链接认证事件接口
 */
export interface EmailLinkAuthEvent {
  type: 'send' | 'verify' | 'error' | 'success';
  email?: string;
  error?: Error;
  timestamp: Date;
}

/**
 * 邮件链接认证配置接口
 */
export interface EmailLinkAuthConfig {
  /** 重定向 URL */
  redirectUrl?: string;
  /** iOS 应用配置 */
  ios?: {
    bundleId: string;
  };
  /** Android 应用配置 */
  android?: {
    packageName: string;
    installApp?: boolean;
    minimumVersion?: string;
  };
  /** 动态链接域名 */
  dynamicLinkDomain?: string;
}

/**
 * 创建邮件链接认证实例的工厂函数
 * @param auth Firebase Auth 实例
 * @returns EmailLinkAuth 实例
 */
export function createEmailLinkAuth(auth: Auth): EmailLinkAuth {
  return new EmailLinkAuth(auth);
}

/**
 * 验证邮箱地址格式的工具函数
 * @param email 邮箱地址
 * @returns boolean
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * 清理 URL 查询参数的工具函数
 * @param preserveParams 要保留的参数名数组
 */
export function cleanUrlParams(preserveParams: string[] = []): void {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    // 移除不需要保留的参数
    for (const [key] of params) {
      if (!preserveParams.includes(key)) {
        params.delete(key);
      }
    }
    
    // 更新 URL
    const newUrl = `${url.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, document.title, newUrl);
  }
}
