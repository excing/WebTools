<script lang="ts">
  import { onMount } from 'svelte';
  import { userBehaviorTracker } from '$lib/userBehavior';
  import { conversionTracker } from '$lib/conversionTracking';
  import { abTestManager } from '$lib/abTesting';

  let sessionData = $state(null);
  let funnelData = $state([]);
  let conversions = $state([]);
  let abTests = $state([]);
  let clickHeatmap = $state([]);

  onMount(() => {
    // 获取用户会话数据
    sessionData = userBehaviorTracker.getSession();
    
    // 获取转化漏斗数据
    const toolFunnel = conversionTracker.getFunnelProgress('tool_usage_funnel');
    const authFunnel = conversionTracker.getFunnelProgress('auth_funnel');
    const fcmFunnel = conversionTracker.getFunnelProgress('fcm_setup_funnel');
    
    funnelData = [
      { name: '工具使用漏斗', ...toolFunnel },
      { name: '认证流程漏斗', ...authFunnel },
      { name: 'FCM设置漏斗', ...fcmFunnel }
    ].filter(f => f.steps);

    // 获取转化数据
    conversions = conversionTracker.getSessionConversions();

    // 获取A/B测试数据
    abTests = abTestManager.getActiveTests();

    // 获取点击热力图数据
    clickHeatmap = userBehaviorTracker.getClickHeatmapData();
  });

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  function clearAllData() {
    userBehaviorTracker.clearSession();
    conversionTracker.clearSession();
    abTestManager.clearAssignments();
    location.reload();
  }
</script>

<div class="analytics-dashboard p-6 bg-gray-50 min-h-screen">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">分析仪表板</h1>
      <button 
        onclick={clearAllData}
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        清除所有数据
      </button>
    </div>

    <!-- 用户会话信息 -->
    {#if sessionData}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">当前会话</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{sessionData.pageViews}</div>
            <div class="text-sm text-gray-600">页面浏览</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{sessionData.interactions}</div>
            <div class="text-sm text-gray-600">交互次数</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{sessionData.scrollDepth}%</div>
            <div class="text-sm text-gray-600">最大滚动深度</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {formatDuration(Date.now() - sessionData.startTime)}
            </div>
            <div class="text-sm text-gray-600">会话时长</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 转化漏斗 -->
    {#if funnelData.length > 0}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">转化漏斗</h2>
        <div class="space-y-6">
          {#each funnelData as funnel}
            <div>
              <h3 class="font-medium mb-2">{funnel.name}</h3>
              <div class="flex items-center space-x-2 mb-2">
                <div class="text-sm text-gray-600">
                  进度: {funnel.completed}/{funnel.total} 
                  ({Math.round(funnel.completed / funnel.total * 100)}%)
                </div>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style="width: {funnel.completed / funnel.total * 100}%"
                ></div>
              </div>
              <div class="mt-2 space-y-1">
                {#each funnel.steps as step}
                  <div class="flex items-center space-x-2 text-sm">
                    <div class="w-4 h-4 rounded-full {step.completed ? 'bg-green-500' : 'bg-gray-300'}"></div>
                    <span class="{step.completed ? 'text-green-700' : 'text-gray-500'}">{step.name}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 转化目标 -->
    {#if conversions.length > 0}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">转化目标</h2>
        <div class="space-y-3">
          {#each conversions as conversion}
            <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <div class="font-medium">{conversion.name}</div>
                <div class="text-sm text-gray-600">{conversion.description}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-green-600">+{conversion.value}</div>
                <div class="text-xs text-gray-500">{conversion.category}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- A/B 测试 -->
    {#if abTests.length > 0}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">A/B 测试</h2>
        <div class="space-y-4">
          {#each abTests as test}
            {@const userVariant = abTestManager.getVariant(test.id)}
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium">{test.name}</h3>
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {test.enabled ? '进行中' : '已停止'}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-3">{test.description}</p>
              {#if userVariant}
                <div class="text-sm">
                  <span class="font-medium">当前变体:</span>
                  <span class="px-2 py-1 bg-green-100 text-green-800 rounded ml-1">
                    {test.variants.find(v => v.id === userVariant)?.name || userVariant}
                  </span>
                </div>
              {:else}
                <div class="text-sm text-gray-500">未参与此测试</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 点击热力图统计 -->
    {#if clickHeatmap.length > 0}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">点击热力图</h2>
        <div class="text-sm text-gray-600 mb-4">
          总点击次数: {clickHeatmap.length}
        </div>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#each clickHeatmap.slice(-10) as click}
            <div class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
              <div>
                <span class="font-medium">{click.element}</span>
                <span class="text-gray-500">在 {click.page}</span>
              </div>
              <div class="text-xs text-gray-400">
                ({click.x}, {click.y})
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 如果没有数据 -->
    {#if !sessionData && funnelData.length === 0 && conversions.length === 0}
      <div class="bg-white rounded-lg shadow-md p-12 text-center">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">暂无分析数据</h3>
        <p class="text-gray-600">开始浏览网站和使用工具来生成分析数据</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .analytics-dashboard {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
