import { browser } from '$app/environment';
import { trackPerformance } from './analytics';

// Web Vitals 指标类型
export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Web Vitals 阈值配置
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
};

/**
 * 获取指标评级
 */
function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * 发送 Web Vitals 指标到 Analytics
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  trackPerformance(metric.name, metric.value, 'ms');
  
  // 发送详细的性能数据
  trackPerformance(`${metric.name}_rating`, metric.rating === 'good' ? 1 : metric.rating === 'needs-improvement' ? 2 : 3);
  
  console.log(`Web Vitals - ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
    id: metric.id
  });
}

/**
 * 初始化 Web Vitals 监控
 */
export async function initWebVitals() {
  if (!browser) return;

  try {
    // 动态导入 web-vitals 库
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    // Cumulative Layout Shift (CLS)
    onCLS((metric) => {
      const webVitalsMetric: WebVitalsMetric = {
        name: 'CLS',
        value: metric.value,
        rating: getMetricRating('CLS', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(webVitalsMetric);
    });

    // FID 已被弃用，使用 INP 代替

    // First Contentful Paint (FCP)
    onFCP((metric) => {
      const webVitalsMetric: WebVitalsMetric = {
        name: 'FCP',
        value: metric.value,
        rating: getMetricRating('FCP', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(webVitalsMetric);
    });

    // Largest Contentful Paint (LCP)
    onLCP((metric) => {
      const webVitalsMetric: WebVitalsMetric = {
        name: 'LCP',
        value: metric.value,
        rating: getMetricRating('LCP', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(webVitalsMetric);
    });

    // Time to First Byte (TTFB)
    onTTFB((metric) => {
      const webVitalsMetric: WebVitalsMetric = {
        name: 'TTFB',
        value: metric.value,
        rating: getMetricRating('TTFB', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(webVitalsMetric);
    });

    // Interaction to Next Paint (INP)
    onINP((metric) => {
      const webVitalsMetric: WebVitalsMetric = {
        name: 'INP',
        value: metric.value,
        rating: getMetricRating('INP', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(webVitalsMetric);
    });

    console.log('Web Vitals monitoring initialized');

  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

/**
 * 手动测量自定义性能指标
 */
export function measureCustomMetric(name: string, startTime: number, endTime?: number) {
  if (!browser) return;

  const finalEndTime = endTime || performance.now();
  const duration = finalEndTime - startTime;

  trackPerformance(`custom_${name}`, duration, 'ms');
  
  console.log(`Custom metric - ${name}:`, duration + 'ms');
}

/**
 * 测量资源加载时间
 */
export function measureResourceTiming() {
  if (!browser) return;

  // 等待资源加载完成
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      // 导航时间
      if (navigation) {
        trackPerformance('navigation_dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
        trackPerformance('navigation_load_complete', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
        trackPerformance('navigation_dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms');
        trackPerformance('navigation_tcp_connect', navigation.connectEnd - navigation.connectStart, 'ms');
      }

      // 资源加载时间统计
      const resourceStats = {
        script: { count: 0, totalDuration: 0 },
        stylesheet: { count: 0, totalDuration: 0 },
        image: { count: 0, totalDuration: 0 },
        fetch: { count: 0, totalDuration: 0 }
      };

      resources.forEach(resource => {
        const duration = resource.responseEnd - resource.startTime;
        const type = resource.initiatorType as keyof typeof resourceStats;
        
        if (resourceStats[type]) {
          resourceStats[type].count++;
          resourceStats[type].totalDuration += duration;
        }
      });

      // 发送资源统计
      Object.entries(resourceStats).forEach(([type, stats]) => {
        if (stats.count > 0) {
          trackPerformance(`resource_${type}_count`, stats.count);
          trackPerformance(`resource_${type}_avg_duration`, stats.totalDuration / stats.count, 'ms');
        }
      });

    }, 1000); // 延迟1秒确保所有资源加载完成
  });
}

/**
 * 监控内存使用情况
 */
export function measureMemoryUsage() {
  if (!browser || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  
  trackPerformance('memory_used_js_heap_size', memory.usedJSHeapSize / 1024 / 1024, 'MB');
  trackPerformance('memory_total_js_heap_size', memory.totalJSHeapSize / 1024 / 1024, 'MB');
  trackPerformance('memory_js_heap_size_limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB');
}

/**
 * 监控网络连接信息
 */
export function measureNetworkInfo() {
  if (!browser || !('connection' in navigator)) return;

  const connection = (navigator as any).connection;
  
  if (connection) {
    trackPerformance('network_downlink', connection.downlink, 'Mbps');
    trackPerformance('network_rtt', connection.rtt, 'ms');
    
    // 发送连接类型信息
    trackPerformance('network_effective_type', connection.effectiveType === '4g' ? 4 : connection.effectiveType === '3g' ? 3 : connection.effectiveType === '2g' ? 2 : 1);
  }
}
