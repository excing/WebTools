<script lang="ts">
  import { trackUserInteraction } from '$lib/analytics';
  import SEOHead from '$lib/components/SEOHead.svelte';
  import { pageSEOData, generateStructuredData, siteConfig } from '$lib/seo';
  import { getABTestConfig } from '$lib/abTesting';
  import { trackFunnelStep, trackConversionGoal } from '$lib/conversionTracking';
  import { onMount } from 'svelte';

  // 根据 tools 绘制 UI 跳转
  const tools = [
    {
      name: "Auth",
      description: "Firebase Authentication",
      href: "/ft/auth",
      category: "firebase",
      tools: [
        {
          name: "Google",
          description: "Google Authentication",
          href: "/ft/auth/google",
        },
        {
          name: "Email Link",
          description: "Email Link Authentication",
          href: "/ft/auth/email",
        },
      ],
    },
    {
      name: "FCM",
      description: "Firebase Cloud Messaging",
      href: "/ft/fcm",
      category: "firebase",
      tools: [
        {
          name: "Device",
          description: "Device to Device Messaging",
          href: "/ft/fcm/device",
        },
        {
          name: "Topics",
          description: "Device to Topics Messaging",
          href: "/ft/fcm/topics",
        },
      ],
    },
    {
      name: "Firestore",
      description: "Cloud Firestore Database",
      href: "/ft/firestore",
      category: "firebase",
      tools: [
        {
          name: "Data Management",
          description: "Firestore Data Management",
          href: "/ft/firestore",
        },
      ],
    },
    {
      name: "Tools",
      description: "Local tools",
      href: "/tools",
      category: "utilities",
      tools: [
        {
          name: "UUID",
          description: "Generate UUID",
          href: "/tools/uuid",
        },
      ],
    },
  ];

  // 处理工具点击事件
  function handleToolClick(toolName: string, category: string) {
    trackUserInteraction('click', 'tool_link', `${category}:${toolName}`);

    // 追踪转化漏斗步骤
    trackFunnelStep('tool_usage_funnel', 'tool_page_visit', {
      tool_name: toolName,
      category: category
    });
  }

  // A/B 测试配置
  let ctaConfig = $state({ ctaText: '开始使用', ctaColor: 'blue' });

  // 页面加载时的初始化
  onMount(() => {
    // 追踪首页访问
    trackFunnelStep('tool_usage_funnel', 'homepage_visit');

    // 获取A/B测试配置
    const abTestConfig = getABTestConfig('homepage_cta_test');
    if (abTestConfig && abTestConfig.ctaText && abTestConfig.ctaColor) {
      ctaConfig = {
        ctaText: abTestConfig.ctaText,
        ctaColor: abTestConfig.ctaColor
      };
    }
  });

  // 生成首页结构化数据
  const homeStructuredData = generateStructuredData('WebApplication', {
    name: 'WebTools',
    description: '专业的在线工具集合，包含Firebase认证、消息推送、UUID生成等实用工具',
    url: siteConfig.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: [
      'Firebase身份认证',
      'Google OAuth认证',
      '邮件链接认证',
      'Firebase云消息推送',
      '设备间消息传递',
      '主题消息订阅',
      'UUID在线生成'
    ],
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url
    }
  });
</script>

<!-- SEO 元数据 -->
<SEOHead seo={pageSEOData.home} structuredData={homeStructuredData} pathname="/" />

<!-- 主要内容区域 -->
<main class="min-h-screen bg-gray-50">
  <!-- 页面头部 -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">WebTools</h1>
          <p class="mt-2 text-lg text-gray-600">专业的在线工具集合，助力开发者高效工作</p>
        </div>
        <a
          href="/analytics"
          class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          分析数据
        </a>
      </div>
    </div>
  </header>

  <!-- 工具列表 -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {#each tools as tool}
        <article class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
          <header class="mb-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">{tool.name}</h2>
            <p class="text-gray-600">{tool.description}</p>
          </header>

          <nav>
            <ul class="space-y-2">
              {#each tool.tools as subTool}
                <li>
                  <a
                    href={subTool.href}
                    class="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                    onclick={() => handleToolClick(subTool.name, tool.category)}
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    {subTool.name}
                  </a>
                  <p class="text-sm text-gray-500 ml-6 mt-1">{subTool.description}</p>
                </li>
              {/each}
            </ul>
          </nav>
        </article>
      {/each}
    </div>
  </div>

  <!-- 页面底部信息 -->
  <footer class="bg-white border-t mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center text-gray-600">
        <p class="mb-2">WebTools - 专业的在线工具集合</p>
        <p class="text-sm">提供安全、可靠、易用的开发者工具服务</p>
      </div>
    </div>
  </footer>
</main>
