<script lang="ts">
  import { COOKIE_CATEGORIES, cookieConsentManager, type CookieCategory } from '$lib/cookieConsent';
  import { onMount } from 'svelte';

  let categories: CookieCategory[] = [];
  let lastUpdated = '2024-07-26';

  onMount(() => {
    categories = cookieConsentManager.getCategories();
  });

  function formatDuration(duration: string): string {
    return duration;
  }
</script>

<svelte:head>
  <title>Cookie隐私政策 - WebTools</title>
  <meta name="description" content="了解WebTools如何使用Cookie以及您的隐私权利。符合GDPR规范的详细Cookie政策说明。" />
  <meta name="robots" content="index, follow" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="Cookie隐私政策 - WebTools" />
  <meta property="og:description" content="了解WebTools如何使用Cookie以及您的隐私权利。符合GDPR规范的详细Cookie政策说明。" />
  <meta property="og:type" content="article" />
  
  <!-- Schema.org -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Cookie隐私政策",
      "description": "WebTools的Cookie使用政策和隐私保护说明",
      "publisher": {
        "@type": "Organization",
        "name": "WebTools"
      },
      "dateModified": "2024-07-26"
    }
  </script>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- 页面标题 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Cookie隐私政策</h1>
      <p class="text-gray-600 text-lg leading-relaxed">
        本政策说明了WebTools如何使用Cookie和类似技术，以及您对这些技术的控制权。
        我们致力于保护您的隐私，并遵守GDPR等相关法规。
      </p>
      <div class="mt-4 text-sm text-gray-500">
        最后更新：{lastUpdated}
      </div>
    </div>

    <!-- 什么是Cookie -->
    <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
      <h2 class="text-2xl font-semibold text-gray-900 mb-4">什么是Cookie？</h2>
      <div class="prose prose-gray max-w-none">
        <p class="text-gray-600 leading-relaxed mb-4">
          Cookie是当您访问网站时存储在您设备上的小型文本文件。它们被广泛用于使网站正常工作，
          或更高效地工作，以及向网站所有者提供信息。
        </p>
        <p class="text-gray-600 leading-relaxed">
          我们使用Cookie来改善您的浏览体验、分析网站使用情况、记住您的偏好设置，
          并提供个性化的内容和功能。
        </p>
      </div>
    </div>

    <!-- Cookie分类详情 -->
    <div class="space-y-6">
      {#each categories as category}
        <div class="bg-white rounded-lg shadow-sm p-8">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                {category.name}
                {#if category.required}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                    必需
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                    可选
                  </span>
                {/if}
              </h3>
              <p class="text-gray-600 leading-relaxed">
                {category.description}
              </p>
            </div>
          </div>

          <!-- Cookie详情表格 -->
          <div class="mt-6">
            <h4 class="text-lg font-medium text-gray-900 mb-4">使用的Cookie：</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cookie名称
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用途
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      有效期
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提供方
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each category.cookies as cookie}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cookie.name}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600">
                        {cookie.purpose}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDuration(cookie.duration)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cookie.provider}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {cookie.type === 'first-party' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                          {cookie.type === 'first-party' ? '第一方' : '第三方'}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- 您的权利 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mt-8">
      <h2 class="text-2xl font-semibold text-gray-900 mb-4">您的权利</h2>
      <div class="prose prose-gray max-w-none">
        <p class="text-gray-600 leading-relaxed mb-4">
          根据GDPR和其他适用的隐私法律，您拥有以下权利：
        </p>
        <ul class="list-disc list-inside text-gray-600 space-y-2">
          <li><strong>同意权：</strong>您可以选择接受或拒绝非必要的Cookie</li>
          <li><strong>撤回同意权：</strong>您可以随时撤回之前给予的同意</li>
          <li><strong>访问权：</strong>您可以了解我们收集了哪些关于您的信息</li>
          <li><strong>删除权：</strong>您可以要求删除您的个人数据</li>
          <li><strong>数据可携权：</strong>您可以要求以结构化格式获取您的数据</li>
        </ul>
      </div>
    </div>

    <!-- 管理Cookie设置 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mt-8">
      <h2 class="text-2xl font-semibold text-gray-900 mb-4">管理Cookie设置</h2>
      <div class="prose prose-gray max-w-none">
        <p class="text-gray-600 leading-relaxed mb-6">
          您可以通过以下方式管理Cookie设置：
        </p>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="font-medium text-gray-900">网站Cookie设置</h3>
              <p class="text-sm text-gray-600">在我们的Cookie设置页面中管理您的偏好</p>
            </div>
            <a 
              href="/cookie-settings" 
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              管理设置
            </a>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">浏览器设置</h3>
            <p class="text-sm text-gray-600 mb-3">
              您也可以通过浏览器设置来控制Cookie：
            </p>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Chrome：设置 → 隐私和安全 → Cookie和其他网站数据</li>
              <li>• Firefox：选项 → 隐私与安全 → Cookie和网站数据</li>
              <li>• Safari：偏好设置 → 隐私 → 管理网站数据</li>
              <li>• Edge：设置 → Cookie和网站权限</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 联系我们 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mt-8">
      <h2 class="text-2xl font-semibold text-gray-900 mb-4">联系我们</h2>
      <div class="prose prose-gray max-w-none">
        <p class="text-gray-600 leading-relaxed mb-4">
          如果您对我们的Cookie政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
        </p>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-gray-600">
            <strong>邮箱：</strong> privacy@webtools.example.com<br>
            <strong>地址：</strong> [您的公司地址]<br>
            <strong>数据保护官：</strong> dpo@webtools.example.com
          </p>
        </div>
      </div>
    </div>

    <!-- 政策更新 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mt-8">
      <h2 class="text-2xl font-semibold text-gray-900 mb-4">政策更新</h2>
      <div class="prose prose-gray max-w-none">
        <p class="text-gray-600 leading-relaxed">
          我们可能会不时更新此Cookie政策。任何重大变更都会在网站上显著位置通知您，
          并在适当情况下重新获取您的同意。建议您定期查看此政策以了解最新信息。
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  .prose {
    max-width: none;
  }
  
  .prose p {
    margin-bottom: 1rem;
  }
  
  .prose ul {
    margin-bottom: 1rem;
  }
</style>
