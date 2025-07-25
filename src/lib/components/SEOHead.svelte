<script lang="ts">
  import { mergeSEO, validateSEO, generateCanonicalURL, generateRobotsContent, siteConfig, type SEOData } from '$lib/seo';

  interface Props {
    seo: Partial<SEOData>;
    structuredData?: string;
    pathname?: string;
  }

  let { seo, structuredData, pathname = '' }: Props = $props();

  // 合并和验证 SEO 数据
  const finalSEO = $derived(validateSEO(mergeSEO(seo)));

  // 生成 canonical URL
  const canonicalURL = $derived(finalSEO.canonical || generateCanonicalURL(pathname));

  // 生成 robots 内容
  const robotsContent = $derived(generateRobotsContent(finalSEO));
</script>

<svelte:head>
  <!-- 基础 meta 标签 -->
  <title>{finalSEO.title}</title>
  <meta name="description" content={finalSEO.description} />
  {#if finalSEO.keywords}
    <meta name="keywords" content={finalSEO.keywords} />
  {/if}
  
  <!-- Robots -->
  <meta name="robots" content={robotsContent} />
  
  <!-- Canonical URL -->
  <link rel="canonical" href={canonicalURL} />
  
  <!-- Open Graph -->
  <meta property="og:title" content={finalSEO.ogTitle} />
  <meta property="og:description" content={finalSEO.ogDescription} />
  <meta property="og:type" content={finalSEO.ogType || 'website'} />
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:site_name" content={siteConfig.name} />
  <meta property="og:locale" content="zh_CN" />
  {#if finalSEO.ogImage}
    <meta property="og:image" content={finalSEO.ogImage} />
    <meta property="og:image:alt" content={finalSEO.ogTitle} />
  {/if}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content={finalSEO.twitterCard || 'summary_large_image'} />
  <meta name="twitter:site" content={siteConfig.twitter} />
  <meta name="twitter:title" content={finalSEO.twitterTitle} />
  <meta name="twitter:description" content={finalSEO.twitterDescription} />
  {#if finalSEO.twitterImage}
    <meta name="twitter:image" content={finalSEO.twitterImage} />
  {/if}
  
  <!-- 额外的 meta 标签 -->
  <meta name="author" content={siteConfig.author} />
  <meta name="generator" content="SvelteKit" />
  <meta name="theme-color" content="#3b82f6" />
  
  <!-- 结构化数据 -->
  {#if structuredData}
    <script type="application/ld+json">{structuredData}</script>
  {/if}

  {#if finalSEO.structuredData}
    <script type="application/ld+json">{JSON.stringify(finalSEO.structuredData, null, 2)}</script>
  {/if}
</svelte:head>
