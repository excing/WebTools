<script lang="ts">
  import { env } from "$env/dynamic/public";
  import { fireapp } from "$lib/firebase";
  import { apiUrl } from "$lib/utils/dev";
  import { getToken, onMessage } from "firebase/messaging";
  import { onMount } from "svelte";

  let message = $state();
  let send = $state("");

  let firebaseDeviceToken = $state("");

  async function requestPermissionAndGetToken() {
    try {
      const fire = fireapp();
      const permission = await Notification.requestPermission();
      if (fire && permission === "granted") {
        const token = await getToken(fire.messaging, {
          vapidKey: env.PUBLIC_GOOGLE_FIREBASE_FCM_VAPIDKEY,
        });
        console.log("FCM Device Token:", token);
        // Send this token to your server for storing and sending messages
        firebaseDeviceToken = token;

        onMessage(fire.messaging, (payload) => {
          console.log("Message received:", payload);
          // Display notification or update UI based on the message

          message =
            payload.notification?.title + "\n" + payload.notification?.body;
        });
      } else {
        console.log("Notification permission denied.");
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  }

  onMount(() => {});

  function handleSend() {
    // 发送消息
    fetch("/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: firebaseDeviceToken,
        notification: {
          title: "New Message",
          body: send,
        },
      }),
    })
      .then((response) => response.ok)
      .then((ok) => {
        console.log("Message sent:", ok);
        message = ok ? "Sended" : "Send Failed";
      })
      .catch(e => {
        console.log(e);
        message = e.message;
      });
  }
</script>

<!-- 编写一个简单的聊天界面, 使用 tailcss -->
<div>
  <div class="flex flex-col h-screen">
    <div class="flex-1 overflow-y-auto p-4">
      {#if message}
        <div class="bg-gray-100 p-2 rounded mb-2">
          {message}
        </div>
      {/if}
    </div>
    <div class="p-4 flex flex-raw item-center space-x-2">
      <button onclick={requestPermissionAndGetToken}>🔔</button>
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
