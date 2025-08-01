// SEO 工具库
export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  structuredData?: Record<string, any>;
  noindex?: boolean;
  nofollow?: boolean;
}

// 默认 SEO 配置
export const defaultSEO: SEOData = {
  title: 'WebTools - 专业在线工具集合',
  description: 'WebTools提供专业的在线工具集合，包含Firebase身份认证、云消息推送、UUID生成器等实用工具。免费、安全、易用的开发者工具平台。',
  keywords: 'WebTools, 在线工具, 开发者工具, Firebase, UUID生成, 认证工具',
  ogType: 'website',
  twitterCard: 'summary_large_image',
};

// 站点基础信息
export const siteConfig = {
  name: 'WebTools',
  url: 'https://tools.blendiv.com',
  author: 'WebTools Team',
  twitter: '@webtools',
  logo: '/logo.png',
  favicon: '/favicon.png',
};

/**
 * 合并 SEO 数据
 */
export function mergeSEO(pageSEO: Partial<SEOData>): SEOData {
  return {
    ...defaultSEO,
    ...pageSEO,
    // 确保标题包含站点名称
    title: pageSEO.title 
      ? `${pageSEO.title} - ${siteConfig.name}`
      : defaultSEO.title,
    // 设置默认的 Open Graph 数据
    ogTitle: pageSEO.ogTitle || pageSEO.title || defaultSEO.title,
    ogDescription: pageSEO.ogDescription || pageSEO.description || defaultSEO.description,
    ogImage: pageSEO.ogImage || `${siteConfig.url}/og-image.png`,
    // 设置默认的 Twitter Card 数据
    twitterTitle: pageSEO.twitterTitle || pageSEO.title || defaultSEO.title,
    twitterDescription: pageSEO.twitterDescription || pageSEO.description || defaultSEO.description,
    twitterImage: pageSEO.twitterImage || pageSEO.ogImage || `${siteConfig.url}/og-image.png`,
  };
}

/**
 * 生成页面的结构化数据
 */
export function generateStructuredData(type: string, data: Record<string, any>) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(baseData, null, 2);
}

/**
 * 生成工具页面的结构化数据
 */
export function generateToolStructuredData(toolName: string, description: string, url: string) {
  return generateStructuredData('WebApplication', {
    name: toolName,
    description: description,
    url: url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url
    }
  });
}

/**
 * 生成文章页面的结构化数据
 */
export function generateArticleStructuredData(title: string, description: string, url: string, publishDate?: string, modifyDate?: string) {
  return generateStructuredData('Article', {
    headline: title,
    description: description,
    url: url,
    datePublished: publishDate || new Date().toISOString(),
    dateModified: modifyDate || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: siteConfig.name
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}${siteConfig.logo}`
      }
    }
  });
}

/**
 * 生成面包屑导航的结构化数据
 */
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>) {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  });
}

/**
 * 生成 FAQ 的结构化数据
 */
export function generateFAQStructuredData(faqs: Array<{question: string, answer: string}>) {
  return generateStructuredData('FAQPage', {
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  });
}

/**
 * 生成 robots meta 标签内容
 */
export function generateRobotsContent(seo: SEOData): string {
  const robots = [];
  
  if (seo.noindex) {
    robots.push('noindex');
  } else {
    robots.push('index');
  }
  
  if (seo.nofollow) {
    robots.push('nofollow');
  } else {
    robots.push('follow');
  }
  
  return robots.join(', ');
}

/**
 * 生成 canonical URL
 */
export function generateCanonicalURL(path: string): string {
  return `${siteConfig.url}${path}`;
}

/**
 * 验证和清理 SEO 数据
 */
export function validateSEO(seo: SEOData): SEOData {
  return {
    ...seo,
    // 限制标题长度
    title: seo.title.length > 60 ? seo.title.substring(0, 57) + '...' : seo.title,
    // 限制描述长度
    description: seo.description.length > 160 ? seo.description.substring(0, 157) + '...' : seo.description,
    // 确保 keywords 不超过限制
    keywords: seo.keywords && seo.keywords.length > 200 ? seo.keywords.substring(0, 197) + '...' : seo.keywords,
  };
}

// 预定义的页面 SEO 数据
export const pageSEOData = {
  home: {
    title: 'WebTools - 专业在线工具集合',
    description: 'WebTools提供专业的在线工具集合，包含Firebase身份认证、云消息推送、UUID生成器等实用工具。免费、安全、易用的开发者工具平台。',
    keywords: 'WebTools, Firebase认证, 云消息推送, UUID生成, 在线工具, 开发者工具, Google认证, FCM, 邮件认证',
  },
  
  uuidTool: {
    title: 'UUID 在线生成工具',
    description: 'UUID 在线生成工具，支持 UUID v4，附详细介绍、用途、实现方式与原理说明。免费、快速、安全的UUID生成器。',
    keywords: 'UUID, UUID生成, 在线工具, 唯一标识, v4, JavaScript, 实现原理, 开发者工具',
  },
  
  googleAuth: {
    title: 'Google Firebase 认证',
    description: '使用 Google Firebase 进行身份认证，支持弹窗登录和重定向登录，安全可靠的Google OAuth认证服务。',
    keywords: 'Google认证, Firebase认证, OAuth, 身份验证, 登录系统, Google登录',
  },
  
  emailAuth: {
    title: '电子邮件链接认证',
    description: '使用电子邮件链接进行无密码身份认证，安全便捷的邮件验证登录方式。',
    keywords: '邮件认证, 无密码登录, 邮件链接, Firebase认证, 电子邮件验证',
  },
  
  fcmDevice: {
    title: 'FCM 设备消息推送',
    description: 'Firebase Cloud Messaging 设备间消息推送工具，支持实时消息传递和通知推送。',
    keywords: 'FCM, Firebase消息, 推送通知, 设备消息, 云消息, 实时通信',
  },
  
  fcmTopics: {
    title: 'FCM 主题消息推送',
    description: 'Firebase Cloud Messaging 主题消息推送工具，支持主题订阅和群组消息推送。',
    keywords: 'FCM主题, Firebase消息, 主题订阅, 群组推送, 云消息, 批量通知',
  },

  jsExecutor: {
    title: 'JavaScript 在线执行器',
    description: 'JavaScript 在线代码执行器，支持实时运行 JavaScript 代码，查看执行结果和控制台输出。安全、快速的在线 JS 代码测试工具。',
    keywords: 'JavaScript, 在线执行器, JS代码, 代码测试, 在线编程, JavaScript运行, 代码调试, 前端工具, 算法练习, 代码学习',
  },

  rangeTool: {
    title: 'Range 对象操作工具',
    description: 'Range 对象在线操作工具，支持文本选择、Range 创建、文档片段操作等功能。学习和测试 DOM Range API 的专业工具。',
    keywords: 'Range, DOM Range, 文本选择, 文档片段, Range API, DOM操作, 前端开发, JavaScript Range, 选择器工具, 文本处理',
  },
};
