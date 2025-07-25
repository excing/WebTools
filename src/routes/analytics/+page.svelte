<script lang="ts">
  import AnalyticsDashboard from '$lib/components/AnalyticsDashboard.svelte';
  import SEOHead from '$lib/components/SEOHead.svelte';
  import { pageSEOData } from '$lib/seo';

  // SEO 数据
  const analyticsSEO = {
    title: '分析仪表板',
    description: '查看网站使用情况、用户行为分析、转化漏斗和A/B测试数据',
    keywords: ['分析', '仪表板', '用户行为', '转化追踪', 'A/B测试'],
    robots: 'noindex, nofollow' // 分析页面不需要被搜索引擎索引
  };
</script>

<SEOHead seo={analyticsSEO} pathname="/analytics" />

<AnalyticsDashboard />
