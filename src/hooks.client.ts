import { browser } from '$app/environment';
import { beforeNavigate, afterNavigate } from '$app/navigation';
import { analytics } from '$lib/analytics';
import { initWebVitals, measureResourceTiming, measureMemoryUsage, measureNetworkInfo } from '$lib/webVitals';
import { userBehaviorTracker } from '$lib/userBehavior';

// 页面加载时间追踪
let navigationStartTime: number;

if (browser) {
  // 监听导航开始
  // beforeNavigate(() => {
  //   navigationStartTime = performance.now();
  // });

  // // 监听导航完成
  // afterNavigate(({ to, from, type }) => {
  //   if (!to) return;

  //   // 计算页面加载时间
  //   const loadTime = performance.now() - navigationStartTime;
    
  //   // 追踪页面浏览
  //   analytics.trackPageView({
  //     page_title: document.title,
  //     page_location: window.location.href,
  //     page_path: to.url.pathname,
  //   });

  //   // 用户行为追踪
  //   userBehaviorTracker.trackPageView(to.url.pathname);

  //   // 追踪页面加载性能
  //   analytics.trackPerformance('page_load_time', loadTime, 'ms');

  //   // 追踪导航类型
  //   analytics.trackEvent('navigation', {
  //     navigation_type: type,
  //     from_path: from?.url?.pathname || 'direct',
  //     to_path: to.url.pathname,
  //     load_time: loadTime,
  //   });

  //   console.log(`Page tracked: ${to.url.pathname} (${loadTime.toFixed(2)}ms)`);
  // });

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      analytics.trackEvent('page_visibility', {
        event_category: 'engagement',
        visibility_state: 'hidden',
        page_path: window.location.pathname,
      });
    } else if (document.visibilityState === 'visible') {
      analytics.trackEvent('page_visibility', {
        event_category: 'engagement',
        visibility_state: 'visible',
        page_path: window.location.pathname,
      });
    }
  });

  // 监听页面卸载
  window.addEventListener('beforeunload', () => {
    analytics.trackEvent('page_unload', {
      event_category: 'engagement',
      page_path: window.location.pathname,
    });
  });

  // 监听错误
  window.addEventListener('error', (event) => {
    analytics.trackError(
      event.error?.message || 'Unknown error',
      `${event.filename}:${event.lineno}:${event.colno}`,
      true
    );
  });

  // 监听未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    analytics.trackError(
      event.reason?.message || 'Unhandled promise rejection',
      'Promise rejection',
      true
    );
  });

  // 初始化 Web Vitals 监控
  initWebVitals();

  // 监控资源加载时间
  measureResourceTiming();

  // 定期监控内存和网络信息
  setInterval(() => {
    measureMemoryUsage();
    measureNetworkInfo();
  }, 30000); // 每30秒监控一次

  // 页面卸载时进行最后一次性能测量
  window.addEventListener('beforeunload', () => {
    measureMemoryUsage();
    measureNetworkInfo();
  });
}
