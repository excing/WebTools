<script lang="ts">
  import { 
    cookieConsentManager, 
    COOKIE_CATEGORIES, 
    consentState,
    type ConsentState,
    type CookieCategory 
  } from '$lib/cookieConsent';
  import { onMount } from 'svelte';

  let currentConsent: ConsentState | null = null;
  let formConsent = $state({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  let hasChanges = $state(false);
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 监听同意状态变化
  $effect(() => {
    currentConsent = $consentState;
    if (currentConsent) {
      formConsent = { ...currentConsent };
    }
  });

  // 检测是否有变更
  $effect(() => {
    if (currentConsent) {
      hasChanges = Object.keys(formConsent).some(key => {
        if (key === 'necessary') return false; // 必要Cookie不能更改
        return formConsent[key as keyof ConsentState] !== currentConsent![key as keyof ConsentState];
      });
    }
  });

  onMount(() => {
    currentConsent = cookieConsentManager.getConsentState();
    if (currentConsent) {
      formConsent = { ...currentConsent };
    }
  });

  async function saveSettings() {
    saveStatus = 'saving';
    
    try {
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      cookieConsentManager.setConsent(formConsent);
      saveStatus = 'saved';
      
      // 3秒后重置状态
      setTimeout(() => {
        saveStatus = 'idle';
      }, 3000);
    } catch (error) {
      console.error('Failed to save cookie settings:', error);
      saveStatus = 'error';
      
      setTimeout(() => {
        saveStatus = 'idle';
      }, 3000);
    }
  }

  function resetToDefaults() {
    formConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
  }

  function acceptAll() {
    formConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
  }

  function getCategoryInfo(categoryId: string): CookieCategory | undefined {
    return COOKIE_CATEGORIES.find(cat => cat.id === categoryId);
  }

  function formatLastUpdated(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }
</script>

<svelte:head>
  <title>Cookie设置 - WebTools</title>
  <meta name="description" content="管理您的Cookie偏好设置，控制WebTools如何使用Cookie来改善您的体验。" />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- 页面标题 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Cookie设置</h1>
      <p class="text-gray-600 text-lg leading-relaxed">
        在这里您可以管理Cookie偏好设置，控制我们如何使用Cookie来改善您的体验。
        您的选择将被保存并应用于所有后续访问。
      </p>
      
      {#if currentConsent}
        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            <strong>当前状态：</strong>您已于 {formatLastUpdated(currentConsent.timestamp)} 设置了Cookie偏好
          </p>
        </div>
      {:else}
        <div class="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p class="text-sm text-yellow-800">
            <strong>提示：</strong>您尚未设置Cookie偏好。请选择您的偏好设置并保存。
          </p>
        </div>
      {/if}
    </div>

    <!-- Cookie分类设置 -->
    <div class="space-y-6">
      {#each COOKIE_CATEGORIES as category}
        {@const isRequired = category.required}
        {@const isEnabled = formConsent[category.id as keyof ConsentState]}
        
        <div class="bg-white rounded-lg shadow-sm p-8">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <h3 class="text-xl font-semibold text-gray-900">
                  {category.name}
                </h3>
                {#if isRequired}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-3">
                    必需
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-3">
                    可选
                  </span>
                {/if}
              </div>
              <p class="text-gray-600 leading-relaxed mb-4">
                {category.description}
              </p>
            </div>
            
            <!-- 开关 -->
            <div class="ml-6">
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={formConsent[category.id]}
                  disabled={isRequired}
                  class="sr-only"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 {isRequired ? 'opacity-50 cursor-not-allowed' : ''}">
                </div>
                <span class="ml-3 text-sm font-medium text-gray-900">
                  {isEnabled ? '已启用' : '已禁用'}
                </span>
              </label>
            </div>
          </div>

          <!-- Cookie详情 -->
          <div class="mt-6">
            <h4 class="text-lg font-medium text-gray-900 mb-3">相关Cookie：</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#each category.cookies as cookie}
                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <h5 class="font-medium text-gray-900">{cookie.name}</h5>
                    <span class="text-xs px-2 py-1 rounded-full {cookie.type === 'first-party' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                      {cookie.type === 'first-party' ? '第一方' : '第三方'}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{cookie.purpose}</p>
                  <div class="flex justify-between text-xs text-gray-500">
                    <span>有效期: {cookie.duration}</span>
                    <span>提供方: {cookie.provider}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- 操作按钮 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mt-8">
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onclick={resetToDefaults}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            重置为默认
          </button>
          
          <button
            type="button"
            onclick={acceptAll}
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            接受全部
          </button>
        </div>

        <div class="flex items-center gap-3">
          {#if saveStatus === 'saved'}
            <span class="text-sm text-green-600 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              设置已保存
            </span>
          {:else if saveStatus === 'error'}
            <span class="text-sm text-red-600 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              保存失败
            </span>
          {/if}
          
          <button
            type="button"
            onclick={saveSettings}
            disabled={!hasChanges || saveStatus === 'saving'}
            class="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if saveStatus === 'saving'}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              保存中...
            {:else}
              保存设置
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- 相关链接 -->
    <div class="bg-white rounded-lg shadow-sm p-8 mt-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">相关信息</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a 
          href="/cookie-policy" 
          class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <h3 class="font-medium text-gray-900 mb-2">Cookie隐私政策</h3>
          <p class="text-sm text-gray-600">了解我们如何使用Cookie以及您的权利</p>
        </a>
        
        <a 
          href="/privacy-policy" 
          class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <h3 class="font-medium text-gray-900 mb-2">隐私政策</h3>
          <p class="text-sm text-gray-600">查看我们的完整隐私政策</p>
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  /* 自定义开关样式 */
  input[type="checkbox"]:checked + div {
    background-color: #2563eb;
  }
  
  input[type="checkbox"]:checked + div:after {
    transform: translateX(100%);
  }
  
  input[type="checkbox"]:focus + div {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
  }
</style>
