<script lang="ts">
  import { 
    showBanner, 
    acceptAllCookies, 
    rejectAllCookies,
    cookieConsentManager,
    COOKIE_CATEGORIES,
    type ConsentState
  } from '$lib/cookieConsent';
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  const dispatch = createEventDispatcher();

  let showDetails = $state(false);
  let customConsent = $state({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  // 获取非必要的分类
  const optionalCategories = COOKIE_CATEGORIES.filter(cat => !cat.required);

  function handleAcceptAll() {
    acceptAllCookies();
    dispatch('consentGiven', { type: 'accept-all' });
  }

  function handleRejectAll() {
    rejectAllCookies();
    dispatch('consentGiven', { type: 'reject-all' });
  }

  function handleCustomSave() {
    cookieConsentManager.setConsent(customConsent);
    showBanner.set(false);
    dispatch('consentGiven', { type: 'custom', consent: customConsent });
  }

  function toggleDetails() {
    showDetails = !showDetails;
  }

  function getCategoryDescription(categoryId: string): string {
    const category = COOKIE_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.description || '';
  }

  function getCategoryName(categoryId: string): string {
    const category = COOKIE_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.name || '';
  }
</script>

{#if $showBanner}
  <div 
    class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
    transition:slide={{ duration: 300, easing: quintOut }}
    role="dialog"
    aria-labelledby="cookie-banner-title"
    aria-describedby="cookie-banner-description"
  >
    <div class="max-w-7xl mx-auto p-4 sm:p-6">
      <!-- 基本信息 -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex-1">
          <h2 id="cookie-banner-title" class="text-lg font-semibold text-gray-900 mb-2">
            🍪 我们使用Cookie来改善您的体验
          </h2>
          <p id="cookie-banner-description" class="text-gray-600 text-sm leading-relaxed">
            我们使用Cookie和类似技术来提供、保护和改善我们的服务。通过点击"接受全部"，
            您同意我们使用Cookie进行分析、个性化和广告。
            <a href="/cookie-policy" class="text-blue-600 hover:text-blue-800 underline">
              了解更多
            </a>
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col sm:flex-row gap-3 lg:ml-6">
          <button
            type="button"
            onclick={handleRejectAll}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            拒绝全部
          </button>
          
          <button
            type="button"
            onclick={toggleDetails}
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            自定义设置
          </button>
          
          <button
            type="button"
            onclick={handleAcceptAll}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            接受全部
          </button>
        </div>
      </div>

      <!-- 详细设置 -->
      {#if showDetails}
        <div 
          class="mt-6 pt-6 border-t border-gray-200"
          transition:slide={{ duration: 200, easing: quintOut }}
        >
          <h3 class="text-md font-medium text-gray-900 mb-4">自定义Cookie设置</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <!-- 必要Cookie（不可关闭） -->
            <div class="p-4 bg-gray-50 rounded-lg border">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-900">
                  {getCategoryName('necessary')}
                </label>
                <div class="flex items-center">
                  <span class="text-xs text-gray-500 mr-2">必需</span>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-600">
                {getCategoryDescription('necessary')}
              </p>
            </div>

            <!-- 可选Cookie分类 -->
            {#each optionalCategories as category}
              <div class="p-4 bg-gray-50 rounded-lg border">
                <div class="flex items-center justify-between mb-2">
                  <label for="consent-{category.id}" class="text-sm font-medium text-gray-900">
                    {category.name}
                  </label>
                  <input
                    id="consent-{category.id}"
                    type="checkbox"
                    bind:checked={customConsent[category.id]}
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <p class="text-xs text-gray-600">
                  {category.description}
                </p>
              </div>
            {/each}
          </div>

          <!-- 自定义设置操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onclick={toggleDetails}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              取消
            </button>
            
            <button
              type="button"
              onclick={handleCustomSave}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              保存设置
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* 确保横幅在所有内容之上 */
  :global(body) {
    padding-bottom: 0;
  }
  
  /* 当横幅显示时为body添加底部padding */
  :global(body:has(.cookie-banner-visible)) {
    padding-bottom: 200px;
  }
  
  /* 响应式调整 */
  @media (max-width: 640px) {
    :global(body:has(.cookie-banner-visible)) {
      padding-bottom: 300px;
    }
  }
</style>
