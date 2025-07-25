<!-- Firebase 电子邮件链接认证页面 -->

<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { fireapp } from "$lib/firebase";
  import {
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,
    type User,
    type ActionCodeSettings
  } from "firebase/auth";
  import { onMount } from "svelte";

  // 状态管理
  let isLoading = $state(false);
  let isLogin = $state(false);
  let user = $state<User | null>(null);
  let error = $state<string | null>(null);
  let messages = $state<string[]>(["欢迎使用电子邮件链接认证"]);
  
  // 表单状态
  let email = $state("");
  let isEmailSent = $state(false);
  let isValidatingLink = $state(false);

  // 添加消息到日志
  function addMessage(message: string) {
    messages = [...messages, `[${new Date().toLocaleTimeString()}] ${message}`];
  }

  // 发送登录链接到邮箱
  async function sendLoginLink() {
    if (isLoading || !email.trim()) return;
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      error = "请输入有效的邮箱地址";
      addMessage("邮箱格式无效");
      return;
    }

    isLoading = true;
    error = null;
    addMessage(`正在发送登录链接到 ${email}...`);

    try {
      const fire = fireapp();
      
      // 配置邮件链接设置
      const actionCodeSettings: ActionCodeSettings = {
        // 用户点击邮件链接后的重定向 URL
        url: `${window.location.origin}/ft/auth/email`,
        // 这必须为 true
        handleCodeInApp: true,
        // iOS 应用配置（可选）
        iOS: {
          bundleId: 'com.example.webtools'
        },
        // Android 应用配置（可选）
        android: {
          packageName: 'com.example.webtools',
          installApp: true,
          minimumVersion: '12'
        },
        // 动态链接域名（可选）
        dynamicLinkDomain: 'webtools.page.link'
      };

      await sendSignInLinkToEmail(fire.auth, email.trim(), actionCodeSettings);
      
      // 保存邮箱到本地存储，以便后续验证
      if (browser) {
        localStorage.setItem('emailForSignIn', email.trim());
      }
      
      isEmailSent = true;
      addMessage("登录链接已发送到您的邮箱");
      addMessage("请检查您的邮箱并点击链接完成登录");
      
    } catch (error: any) {
      console.error("发送邮件链接时出错:", error);
      
      let errorMessage = "发送邮件链接失败";
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "邮箱地址格式无效";
          break;
        case 'auth/user-disabled':
          errorMessage = "该用户账户已被禁用";
          break;
        case 'auth/too-many-requests':
          errorMessage = "请求过于频繁，请稍后再试";
          break;
        case 'auth/network-request-failed':
          errorMessage = "网络连接失败，请检查网络后重试";
          break;
        default:
          errorMessage = error.message || "未知错误";
      }
      
      error = errorMessage;
      addMessage(`错误: ${errorMessage}`);
    } finally {
      isLoading = false;
    }
  }

  // 验证邮件链接并完成登录
  async function verifyEmailLink() {
    if (!browser) return;
    
    const currentUrl = window.location.href;
    const fire = fireapp();
    
    // 检查当前 URL 是否为有效的登录链接
    if (isSignInWithEmailLink(fire.auth, currentUrl)) {
      isValidatingLink = true;
      addMessage("检测到邮件登录链接，正在验证...");
      
      try {
        // 从本地存储获取邮箱
        let emailForSignIn = localStorage.getItem('emailForSignIn');
        
        // 如果没有保存的邮箱，提示用户输入
        if (!emailForSignIn) {
          emailForSignIn = window.prompt('请输入您的邮箱地址以完成登录:');
        }
        
        if (!emailForSignIn) {
          throw new Error('需要邮箱地址才能完成登录');
        }
        
        // 使用邮件链接登录
        const result = await signInWithEmailLink(fire.auth, emailForSignIn, currentUrl);
        
        user = result.user;
        isLogin = true;
        
        // 清除本地存储的邮箱
        localStorage.removeItem('emailForSignIn');
        
        addMessage(`邮件链接登录成功！欢迎 ${user.email}`);
        
        // 清除 URL 中的查询参数
        window.history.replaceState({}, document.title, window.location.pathname);
        
      } catch (error: any) {
        console.error("邮件链接登录失败:", error);
        
        let errorMessage = "邮件链接登录失败";
        switch (error.code) {
          case 'auth/invalid-action-code':
            errorMessage = "登录链接无效或已过期";
            break;
          case 'auth/invalid-email':
            errorMessage = "邮箱地址无效";
            break;
          case 'auth/user-disabled':
            errorMessage = "该用户账户已被禁用";
            break;
          default:
            errorMessage = error.message || "未知错误";
        }
        
        error = errorMessage;
        addMessage(`错误: ${errorMessage}`);
      } finally {
        isValidatingLink = false;
      }
    }
  }

  // 重新发送邮件
  function resendEmail() {
    isEmailSent = false;
    error = null;
    addMessage("准备重新发送邮件");
  }

  // 登出处理
  async function handleLogout() {
    if (isLoading) return;
    
    isLoading = true;
    error = null;
    addMessage("正在登出...");

    try {
      const fire = fireapp();
      await fire.auth.signOut();
      user = null;
      isLogin = false;
      isEmailSent = false;
      email = "";
      addMessage("已成功登出");
    } catch (error: any) {
      console.error("登出时出错:", error);
      error = error.message || "登出失败";
      addMessage(`登出错误: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  // 清除消息日志
  function clearMessages() {
    messages = ["欢迎使用电子邮件链接认证"];
  }

  // 复制用户信息到剪贴板
  async function copyUserInfo() {
    if (!user) return;
    
    const userInfo = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(userInfo, null, 2));
      addMessage("用户信息已复制到剪贴板");
    } catch (error) {
      addMessage("复制失败，请手动复制");
    }
  }

  // 组件挂载时的初始化
  onMount(() => {
    if (browser) {
      addMessage("正在初始化 Firebase 认证...");
      
      try {
        const fire = fireapp();
        
        // 监听认证状态变化
        const unsubscribe = onAuthStateChanged(fire.auth, (authUser) => {
          if (authUser) {
            user = authUser;
            isLogin = true;
            addMessage(`检测到已登录用户: ${authUser.email}`);
          } else {
            user = null;
            isLogin = false;
            addMessage("当前未登录");
          }
          isLoading = false;
        });

        // 检查是否为邮件链接登录
        verifyEmailLink();

        // 清理函数
        return () => {
          unsubscribe();
        };
        
      } catch (error: any) {
        console.error("Firebase 初始化失败:", error);
        error = "Firebase 初始化失败";
        addMessage(`初始化错误: ${error}`);
        isLoading = false;
      }
    }
  });
</script>

<!-- 页面标题 -->
<svelte:head>
  <title>电子邮件链接认证 - WebTools</title>
  <meta name="description" content="使用电子邮件链接进行无密码身份认证" />
</svelte:head>

<!-- 主要内容区域 -->
<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">电子邮件链接认证</h1>
      <p class="text-gray-600">无密码安全登录，通过邮件链接验证身份</p>
    </div>

    <!-- 验证链接状态提示 -->
    {#if isValidatingLink}
      <div class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-blue-800">正在验证邮件链接</h3>
            <p class="mt-1 text-sm text-blue-700">请稍候，正在处理您的登录请求...</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- 错误提示 -->
    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">认证错误</h3>
            <p class="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <div class="ml-auto pl-3">
            <button
              onclick={() => error = null}
              class="inline-flex text-red-400 hover:text-red-600"
              aria-label="关闭错误提示"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

      <!-- 邮件认证控制面板 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">邮件链接认证</h2>

        {#if !isLogin}
          <!-- 未登录状态 -->
          <div class="space-y-6">
            {#if !isEmailSent}
              <!-- 邮箱输入表单 -->
              <div class="text-center mb-6">
                <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p class="text-gray-500 mb-6">输入您的邮箱地址，我们将发送登录链接</p>
              </div>

              <div class="space-y-4">
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <input
                    id="email"
                    type="email"
                    bind:value={email}
                    placeholder="请输入您的邮箱地址"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>

                <button
                  onclick={sendLoginLink}
                  disabled={isLoading || !email.trim()}
                  class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {#if isLoading}
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在发送...
                  {:else}
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    发送登录链接
                  {/if}
                </button>
              </div>
            {:else}
              <!-- 邮件已发送状态 -->
              <div class="text-center space-y-4">
                <div class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">邮件已发送！</h3>
                  <p class="text-gray-600 mb-4">
                    我们已向 <span class="font-medium text-gray-900">{email}</span> 发送了登录链接
                  </p>
                  <p class="text-sm text-gray-500 mb-6">
                    请检查您的邮箱（包括垃圾邮件文件夹），点击邮件中的链接完成登录
                  </p>
                </div>

                <div class="space-y-3">
                  <button
                    onclick={resendEmail}
                    class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重新发送邮件
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <!-- 已登录状态 -->
          <div class="space-y-6">
            <!-- 用户信息 -->
            <div class="text-center">
              <div class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <h3 class="text-lg font-medium text-gray-900 mb-2">登录成功！</h3>
              <p class="text-gray-600 mb-4">{user?.email}</p>

              <div class="flex items-center justify-center mb-4">
                {#if user?.emailVerified}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    邮箱已验证
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    邮箱未验证
                  </span>
                {/if}
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="space-y-3">
              <button
                onclick={copyUserInfo}
                class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                复制用户信息
              </button>

              <button
                onclick={handleLogout}
                disabled={isLoading}
                class="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {#if isLoading}
                  <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  正在登出...
                {:else}
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  登出
                {/if}
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- 用户详细信息面板 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">用户详细信息</h2>
          {#if user}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              已登录
            </span>
          {:else}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              未登录
            </span>
          {/if}
        </div>

        {#if user}
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">用户 ID</div>
                <div class="p-3 bg-gray-50 rounded-lg border">
                  <code class="text-sm text-gray-900 break-all">{user.uid}</code>
                </div>
              </div>

              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">邮箱地址</div>
                <div class="p-3 bg-gray-50 rounded-lg border">
                  <span class="text-sm text-gray-900">{user.email || "未设置"}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">创建时间</div>
                  <div class="p-3 bg-gray-50 rounded-lg border">
                    <span class="text-sm text-gray-900">
                      {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString('zh-CN') : "未知"}
                    </span>
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">最后登录</div>
                  <div class="p-3 bg-gray-50 rounded-lg border">
                    <span class="text-sm text-gray-900">
                      {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('zh-CN') : "未知"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500">请先登录以查看用户信息</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- 消息日志面板 -->
    <div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900">操作日志</h2>
        <button
          onclick={clearMessages}
          class="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          清除日志
        </button>
      </div>

      <div class="bg-gray-50 rounded-lg border p-4 max-h-64 overflow-y-auto">
        {#if messages.length > 0}
          <div class="space-y-1">
            {#each messages as message}
              <div class="text-sm text-gray-700 font-mono">{message}</div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-gray-500 text-center">暂无日志</p>
        {/if}
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
      <h3 class="text-lg font-medium text-blue-900 mb-4">邮件链接认证说明</h3>
      <div class="text-sm text-blue-800 space-y-2">
        <p>• <strong>无密码登录</strong>：无需记住密码，通过邮件链接安全登录</p>
        <p>• <strong>安全可靠</strong>：每个登录链接都是一次性的，确保账户安全</p>
        <p>• <strong>跨设备支持</strong>：可以在不同设备上点击邮件链接完成登录</p>
        <p>• <strong>自动验证</strong>：通过邮件链接登录会自动验证邮箱地址</p>
      </div>
    </div>

    <!-- 返回首页链接 -->
    <div class="mt-8 text-center">
      <a
        href="/"
        class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回首页
      </a>
    </div>
  </div>
</div>
