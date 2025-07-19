<script lang="ts">
  import { browser } from "$app/environment";
  import { env } from "$env/dynamic/public";
  import { fireapp } from "$lib/firebase";
  import { getToken, onMessage } from "firebase/messaging";
  import { onMount } from "svelte";

  let messages = $state(["Welcome to FCM Device Messaging"]);
  let send = $state("");

  let firebaseDeviceToken = $state("");

  let shouldShowPermissionButton = $state(false);

  async function requestPermissionAndGetToken() {
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
        });
      } else {
        console.log("Notification permission denied.");
        messages = [...messages, "通知权限被拒绝。"];
      }
    } catch (error: any) {
      console.error("Error getting FCM token:", error);
      messages = [...messages, `错误: ${error.message}`];
    }
  }

  function handleSend() {
    const msg = send;
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
      })
      .catch((e) => {
        console.log(e);
        messages = [...messages, e.message];
      });
  }

  onMount(() => {
    if (browser && typeof Notification !== "undefined") {
      shouldShowPermissionButton = Notification.permission !== "granted";
    }
    if (Notification.permission === "granted") {
      requestPermissionAndGetToken(); // 已授权，自动请求 token
    }
  });
</script>

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
