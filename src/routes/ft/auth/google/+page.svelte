<!-- Google Firebase Authentication 页面 -->

<script lang="ts">
  import { browser } from "$app/environment";
  import { fireapp } from "$lib/firebase";
  import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    GoogleAuthProvider,
    type User
  } from "firebase/auth";
  import { onMount } from "svelte";

  // 状态管理
  let isLoading = $state(false);
  let isLogin = $state(false);
  let user = $state<User | null>(null);
  let error = $state<string | null>(null);
  let messages = $state<string[]>(["欢迎使用 Google Firebase 认证"]);

  // 添加消息到日志
  function addMessage(message: string) {
    messages = [...messages, `[${new Date().toLocaleTimeString()}] ${message}`];
  }

  // Google 登录处理
  async function handleLogin() {
    if (isLoading) return;

    isLoading = true;
    error = null;
    addMessage("正在启动 Google 登录...");

    try {
      const fire = fireapp();
      const provider = new GoogleAuthProvider();

      // 添加额外的权限范围
      provider.addScope('profile');
      provider.addScope('email');

      // 设置自定义参数
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(fire.auth, provider);

      // 获取 Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      user = result.user;
      isLogin = true;

      addMessage(`登录成功！欢迎 ${user.displayName || user.email}`);
      if (token) {
        addMessage("已获取 Google Access Token");
      }

    } catch (error: any) {
      console.error("登录时出错:", error);

      // 处理不同类型的错误
      let errorMessage = "登录失败";
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "登录窗口被用户关闭";
          break;
        case 'auth/popup-blocked':
          errorMessage = "登录弹窗被浏览器阻止，请允许弹窗后重试";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "登录请求被取消";
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

  // 使用重定向方式登录（适用于移动设备）
  async function handleLoginWithRedirect() {
    if (isLoading) return;

    isLoading = true;
    error = null;
    addMessage("正在启动 Google 登录（重定向模式）...");

    try {
      const fire = fireapp();
      const provider = new GoogleAuthProvider();

      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      await signInWithRedirect(fire.auth, provider);
      // 重定向后会自动处理结果

    } catch (error: any) {
      console.error("重定向登录时出错:", error);
      error = error.message || "重定向登录失败";
      addMessage(`错误: ${error}`);
      isLoading = false;
    }
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
    messages = ["欢迎使用 Google Firebase 认证"];
  }

  // 复制用户信息到剪贴板
  async function copyUserInfo() {
    if (!user) return;

    const userInfo = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
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
            addMessage(`检测到已登录用户: ${authUser.displayName || authUser.email}`);
          } else {
            user = null;
            isLogin = false;
            addMessage("当前未登录");
          }
          isLoading = false;
        });

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
  <title>Google Firebase 认证 - WebTools</title>
  <meta name="description" content="使用 Google Firebase 进行身份认证" />
</svelte:head>

<!-- 主要内容区域 -->
<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Google Firebase 认证</h1>
      <p class="text-gray-600">使用 Google 账户进行安全登录</p>
    </div>

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

      <!-- 认证控制面板 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">认证控制</h2>

        {#if !isLogin}
          <!-- 未登录状态 -->
          <div class="space-y-4">
            <div class="text-center">
              <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p class="text-gray-500 mb-6">请使用 Google 账户登录</p>
            </div>

            <!-- 登录按钮 -->
            <button
              onclick={handleLogin}
              disabled={isLoading}
              class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {#if isLoading}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在登录...
              {:else}
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 登录
              {/if}
            </button>

            <!-- 重定向登录按钮（移动设备友好） -->
            <button
              onclick={handleLoginWithRedirect}
              disabled={isLoading}
              class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              重定向登录（移动设备）
            </button>
          </div>
        {:else}
          <!-- 已登录状态 -->
          <div class="space-y-6">
            <!-- 用户头像和基本信息 -->
            <div class="flex items-center space-x-4">
              {#if user?.photoURL}
                <img
                  src={user.photoURL}
                  alt="用户头像"
                  class="h-16 w-16 rounded-full border-2 border-gray-200"
                />
              {:else}
                <div class="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg class="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              {/if}

              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">
                  {user?.displayName || "未设置显示名称"}
                </h3>
                <p class="text-sm text-gray-500">{user?.email}</p>
                <div class="flex items-center mt-1">
                  {#if user?.emailVerified}
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      邮箱已验证
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                      邮箱未验证
                    </span>
                  {/if}
                </div>
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

              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">显示名称</div>
                <div class="p-3 bg-gray-50 rounded-lg border">
                  <span class="text-sm text-gray-900">{user.displayName || "未设置"}</span>
                </div>
              </div>

              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">头像 URL</div>
                <div class="p-3 bg-gray-50 rounded-lg border">
                  {#if user.photoURL}
                    <a href={user.photoURL} target="_blank" class="text-sm text-blue-600 hover:text-blue-800 break-all">
                      {user.photoURL}
                    </a>
                  {:else}
                    <span class="text-sm text-gray-500">未设置</span>
                  {/if}
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
