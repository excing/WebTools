<script lang="ts">
  import { browser } from "$app/environment";
  import { env } from "$env/dynamic/public";
  import { fireapp } from "$lib/firebase";
  import { getToken, onMessage } from "firebase/messaging";
  import { onMount } from "svelte";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import { pageSEOData, generateToolStructuredData, siteConfig } from "$lib/seo";
  import { trackToolUsage, trackUserInteraction } from "$lib/analytics";

  let messages = $state(["Welcome to FCM Device Messaging"]);
  let send = $state("");

  let firebaseDeviceToken = $state("");

  let shouldShowPermissionButton = $state(false);

  async function requestPermissionAndGetToken() {
    // 追踪权限请求
    trackUserInteraction('click', 'notification_permission', 'fcm_device');

    try {
      const fire = fireapp();
      const permission = await Notification.requestPermission();
      if (fire && permission === "granted") {
        shouldShowPermissionButton = false;

        const token = await getToken(fire.messaging, {
          vapidKey: env.PUBLIC_GOOGLE_FIREBASE_FCM_VAPIDKEY,
        });
        // console.log("FCM Device Token:", token);
        // Send this token to your server for storing and sending messages
        firebaseDeviceToken = token;

        onMessage(fire.messaging, (payload) => {
          console.log("Message received:", payload);
          // Display notification or update UI based on the message

          messages = [
            ...messages,
            payload.notification?.title + "\n" + payload.notification?.body,
          ];

          // 追踪消息接收
          trackToolUsage('FCM Device', 'message_received', {
            has_title: !!payload.notification?.title,
            has_body: !!payload.notification?.body
          });
        });

        // 追踪权限授予成功
        trackToolUsage('FCM Device', 'permission_granted', {
          token_length: token.length
        });

      } else {
        console.log("Notification permission denied.");
        messages = [...messages, "通知权限被拒绝。"];

        // 追踪权限被拒绝
        trackToolUsage('FCM Device', 'permission_denied');
      }
    } catch (error: any) {
      console.error("Error getting FCM token:", error);
      messages = [...messages, `错误: ${error.message}`];

      // 追踪错误
      trackToolUsage('FCM Device', 'permission_error', {
        error_message: error.message
      });
    }
  }

  function handleSend() {
    const msg = send;

    // 追踪发送消息尝试
    trackUserInteraction('click', 'send_message', 'fcm_device');
    trackToolUsage('FCM Device', 'send_attempt', {
      message_length: msg.length
    });

    // 发送消息
    fetch("/api/fcm/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: firebaseDeviceToken,
        notification: {
          title: "New Message",
          body: msg,
        },
      }),
    })
      .then((response) => response.ok)
      .then((ok) => {
        console.log("Message sent:", ok);
        messages = [...messages, msg + (ok ? " Sended" : " Send Failed")];

        // 追踪发送结果
        if (ok) {
          trackToolUsage('FCM Device', 'send_success');
        } else {
          trackToolUsage('FCM Device', 'send_failure');
        }
      })
      .catch((e) => {
        console.log(e);
        messages = [...messages, e.message];

        // 追踪发送错误
        trackToolUsage('FCM Device', 'send_error', {
          error_message: e.message
        });
      });
  }

  onMount(() => {
    if (browser && typeof Notification !== "undefined") {
      shouldShowPermissionButton = Notification.permission !== "granted";
    }
    if (Notification.permission === "granted") {
      requestPermissionAndGetToken(); // 已授权，自动请求 token
    }

    // 追踪页面访问
    trackToolUsage('FCM Device', 'page_visit', {
      notification_permission: Notification.permission
    });
  });

  // 生成FCM设备消息工具的结构化数据
  const fcmDeviceStructuredData = generateToolStructuredData(
    'FCM 设备消息推送',
    'Firebase Cloud Messaging 设备间消息推送工具，支持实时消息传递和通知推送。',
    `${siteConfig.url}/ft/fcm/device`
  );
</script>

<!-- SEO 元数据 -->
<SEOHead seo={pageSEOData.fcmDevice} structuredData={fcmDeviceStructuredData} />

<!-- 编写一个简单的聊天界面, 使用 tailcss -->
<div>
  <div class="flex flex-col h-screen">
    <div class="flex-1 overflow-y-auto p-4">
      {#each messages as message}
        <div class="bg-gray-100 p-2 rounded mb-2">
          {message}
        </div>
      {/each}
    </div>
    <div class="p-4 flex flex-raw item-center space-x-2">
      {#if shouldShowPermissionButton}
        <button onclick={requestPermissionAndGetToken}>🔔 启用通知</button>
      {/if}
      <input
        class="border border-gray-300 rounded p-2 w-full"
        type="text"
        bind:value={send}
        placeholder="Type your message..."
      />
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onclick={handleSend}
      >
        Send
      </button>
    </div>
  </div>
</div>
