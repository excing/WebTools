<script lang="ts">
  import { browser } from "$app/environment";
  import { env } from "$env/dynamic/public";
  import { fireapp } from "$lib/firebase";
  import { getToken, onMessage } from "firebase/messaging";
  import { onMount } from "svelte";

  let messages = $state([
    "欢迎来到 FCM 主题消息！",
    "请先点击🔔启用通知，然后输入主题名称并订阅。",
  ]);
  let send = $state("");

  let firebaseDeviceToken = $state(""); // 设备 token 仍然需要，并会发送到后端
  let currentTopic = $state("global_chat");
  let isSubscribed = $state(false);

  let shouldShowPermissionButton = $state(false);

  // 1. 请求通知权限并获取设备 token (不变)
  async function requestPermissionAndGetToken() {
    try {
      const fire = fireapp();
      const messagingInstance = fire.messaging;

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        shouldShowPermissionButton = false;

        const token = await getToken(messagingInstance, {
          vapidKey: env.PUBLIC_GOOGLE_FIREBASE_FCM_VAPIDKEY,
        });
        console.log("FCM Device Token:", token);
        firebaseDeviceToken = token;
        messages = [...messages, "已获得 FCM Device Token: " + token];

        onMessage(messagingInstance, (payload) => {
          console.log("Message received:", payload);
          messages = [
            ...messages,
            `收到主题消息: ${payload.notification?.title || ""} - ${payload.notification?.body || ""}`,
          ];
        });
        messages = [...messages, "通知权限已授予，FCM 监听器已启动。"];
      } else {
        console.log("通知权限被拒绝。");
        messages = [...messages, "通知权限被拒绝。"];
      }
    } catch (error: any) {
      console.error("获取 FCM token 或设置监听器时出错:", error);
      messages = [...messages, `错误: ${error.message}`];
    }
  }

  // 2. 处理订阅主题 (现在通过后端 Admin SDK 订阅)
  async function handleSubscribe() {
    if (!firebaseDeviceToken) {
      messages = [...messages, "错误: 请先启用通知以获取设备令牌。"];
      return;
    }
    if (!currentTopic) {
      messages = [...messages, "错误: 请输入一个主题名称。"];
      return;
    }

    try {
      // 向后端发送订阅请求
      const response = await fetch("/api/fcm/subscribe", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: firebaseDeviceToken, // 将 token 发送给后端
          topic: currentTopic,
        }),
      });

      if (response.ok) {
        isSubscribed = true;
        messages = [...messages, `成功向后端请求订阅主题: ${currentTopic}`];
        console.log(`成功请求订阅主题: ${currentTopic}`);
      } else {
        const errorData = await response.json();
        isSubscribed = false;
        messages = [
          ...messages,
          `向后端请求订阅主题失败: ${currentTopic} - ${errorData.error}`,
        ];
        console.error(`向后端请求订阅主题失败: ${currentTopic}`, errorData);
      }
    } catch (error: any) {
      isSubscribed = false;
      messages = [...messages, `网络或未知错误: ${error.message}`];
      console.error(`网络或未知错误: ${error}`, error);
    }
  }

  // 3. 处理取消订阅主题 (现在通过后端 Admin SDK 取消订阅)
  async function handleUnsubscribe() {
    if (!firebaseDeviceToken) {
      messages = [...messages, "错误: 无法取消订阅，因为没有设备令牌。"];
      return;
    }
    if (!currentTopic) {
      messages = [...messages, "错误: 请输入一个主题名称。"];
      return;
    }

    try {
      // 向后端发送取消订阅请求
      const response = await fetch("/api/fcm/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: firebaseDeviceToken, // 将 token 发送给后端
          topic: currentTopic,
        }),
      });

      if (response.ok) {
        isSubscribed = false;
        messages = [...messages, `成功向后端请求取消订阅主题: ${currentTopic}`];
        console.log(`成功请求取消订阅主题: ${currentTopic}`);
      } else {
        const errorData = await response.json();
        messages = [
          ...messages,
          `向后端请求取消订阅主题失败: ${currentTopic} - ${errorData.error}`,
        ];
        console.error(`向后端请求取消订阅主题失败: ${currentTopic}`, errorData);
      }
    } catch (error: any) {
      messages = [...messages, `网络或未知错误: ${error.message}`];
      console.error(`网络或未知错误: ${error}`, error);
    }
  }

  // 4. 处理发送消息 (保持不变，仍向后端发送主题名)
  function handleSend() {
    if (!currentTopic || !isSubscribed) {
      messages = [...messages, "错误: 请先订阅一个主题才能发送消息。"];
      return;
    }
    const msg = send.trim();
    if (!msg) {
      messages = [...messages, "错误: 消息内容不能为空。"];
      return;
    }

    fetch("/api/fcm/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: currentTopic,
        notification: {
          title: `来自 ${currentTopic} 的消息`,
          body: msg,
        },
      }),
    })
      .then((response) => response.ok)
      .then((ok) => {
        const status = ok ? "发送成功 ✅" : "发送失败 ❌";
        console.log("Message sent status:", status);
        messages = [
          ...messages,
          `[发送到 ${currentTopic}]: ${msg} - ${status}`,
        ];
        send = "";
      })
      .catch((e) => {
        console.error("发送消息时发生网络错误:", e);
        messages = [...messages, `发送消息时发生错误: ${e.message}`];
      });
  }

  // 页面加载时执行 (不变)
  onMount(() => {
    if (browser && typeof Notification !== "undefined") {
      shouldShowPermissionButton = Notification.permission !== "granted";
    }

    if (Notification.permission === "granted") {
      requestPermissionAndGetToken();
    }
  });
</script>

<!-- 聊天界面 UI 保持不变 -->
<div class="flex flex-col h-screen font-sans">
  <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
    {#each messages as message, i (i)}
      <div class="bg-white p-3 rounded-lg shadow-sm mb-3 break-words text-sm">
        {message}
      </div>
    {/each}
  </div>

  <div class="p-4 bg-gray-100 border-t border-gray-200">
    {#if shouldShowPermissionButton}
      <button
        class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow mb-3"
        onclick={requestPermissionAndGetToken}
      >
        🔔 启用通知
      </button>
    {/if}

    <div class="flex items-center space-x-2 mb-3">
      <input
        class="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        type="text"
        bind:value={currentTopic}
        placeholder="输入主题名称 (例如: global_chat)"
      />
      {#if !isSubscribed}
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow text-sm transition duration-150 ease-in-out"
          onclick={handleSubscribe}
        >
          订阅主题 (通过后端)
        </button>
      {:else}
        <button
          class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow text-sm transition duration-150 ease-in-out"
          onclick={handleUnsubscribe}
        >
          取消订阅 (通过后端)
        </button>
      {/if}
    </div>

    <div class="flex items-center space-x-2">
      <input
        class="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        type="text"
        bind:value={send}
        placeholder="在此输入您的消息..."
        disabled={!isSubscribed}
      />
      <button
        class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow text-sm transition duration-150 ease-in-out"
        onclick={handleSend}
        disabled={!isSubscribed || !send.trim()}
      >
        发送
      </button>
    </div>
  </div>
</div>
