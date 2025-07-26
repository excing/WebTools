<script lang="ts">
	import "../app.css";
	import { browser } from "$app/environment";
	import { analytics } from "$lib/analytics";
	import { onMount } from "svelte";
	import { beforeNavigate, afterNavigate } from "$app/navigation";
	import { userBehaviorTracker } from "$lib/userBehavior";
	import CookieConsentBanner from "$lib/components/CookieConsentBanner.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { cookieConsentManager } from "$lib/cookieConsent";

	let { children } = $props();

	// 页面加载时间追踪
	let navigationStartTime = $state(0);

	// 初始化 Analytics
	onMount(async () => {
		if (browser) {
			await analytics.init();
		}
	});

	// 处理cookie同意变更
	function handleConsentGiven(event: CustomEvent) {
		const { type, consent } = event.detail;
		console.log('Cookie consent given:', type, consent);

		// 重新初始化分析系统
		if (consent?.analytics || type === 'accept-all') {
			analytics.reinitialize();
			userBehaviorTracker.enable();
		} else {
			analytics.disable();
			userBehaviorTracker.disable();
		}
	}

	// 监听全局同意状态变更
	if (browser) {
		window.addEventListener('consentChanged', (event: Event) => {
			const customEvent = event as CustomEvent;
			const consentState = customEvent.detail;
			if (consentState.analytics) {
				analytics.reinitialize();
				userBehaviorTracker.enable();
			} else {
				analytics.disable();
				userBehaviorTracker.disable();
			}
		});
	}

	// 监听导航开始
	beforeNavigate(() => {
		navigationStartTime = performance.now();
	});

	// 监听导航完成
	afterNavigate(({ to, from, type }) => {
		if (!to) return;

		// 计算页面加载时间
		const loadTime = performance.now() - navigationStartTime;

		// 追踪页面浏览
		analytics.trackPageView({
			page_title: document.title,
			page_location: window.location.href,
			page_path: to.url.pathname,
		});

		// 用户行为追踪
		userBehaviorTracker.trackPageView(to.url.pathname);

		// 追踪页面加载性能
		analytics.trackPerformance("page_load_time", loadTime, "ms");

		// 追踪导航类型
		analytics.trackEvent("navigation", {
			navigation_type: type,
			from_path: from?.url?.pathname || "direct",
			to_path: to.url.pathname,
			load_time: loadTime,
		});

		console.log(
			`Page tracked: ${to.url.pathname} (${loadTime.toFixed(2)}ms)`,
		);
	});
</script>

<!-- 全局 SEO 元数据 -->
<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="robots" content="index, follow" />
	<meta name="author" content="WebTools" />
	<meta name="generator" content="SvelteKit" />

	<!-- Open Graph 基础标签 -->
	<meta property="og:site_name" content="WebTools" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="zh_CN" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@webtools" />

	<!-- 基础 Schema.org 结构化数据 -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "WebTools",
			"description": "专业的在线工具集合，包含Firebase认证、消息推送、UUID生成等实用工具",
			"url": "https://webtools.example.com",
			"potentialAction": {
				"@type": "SearchAction",
				"target": "https://webtools.example.com/search?q={search_term_string}",
				"query-input": "required name=search_term_string"
			}
		}
	</script>
</svelte:head>

{@render children()}

<!-- 页脚 -->
<Footer />

<!-- Cookie同意横幅 -->
<CookieConsentBanner on:consentGiven={handleConsentGiven} />
