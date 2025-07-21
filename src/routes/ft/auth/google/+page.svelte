<!-- 使用 firebase auth 进行登录 -->

<script lang="ts">
  import { browser } from "$app/environment";
  import { fireapp } from "$lib/firebase";
  import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
  import { onMount } from "svelte";

  let messages = $state(["Welcome to Firebase auth"]);

  let isLogin = $state(false);
  let user = $state();

  async function handleLogin() {
    try {
      const fire = fireapp();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(fire.auth, provider);
      user = result.user;
      isLogin = true;
    } catch (error: any) {
      console.error("登录时出错:", error);
      messages = [...messages, `错误: ${error.message}`];
    }
  }

  async function handleLogout() {
    try {
      const fire = fireapp();
      await fire.auth.signOut();
      user = null;
      isLogin = false;
    } catch (error: any) {
      console.error("登出时出错:", error);
      messages = [...messages, `错误: ${error.message}`];
    }
  }

  onMount(() => {
    if (browser) {
      const fire = fireapp();
      onAuthStateChanged(fire.auth, (user) => {
        if (user) {
          isLogin = true;
          user = user;
        } else {
          isLogin = false;
          user = null;
        }
      });
    }
  });
</script>

<div class="flex flex-col h-screen">
  <div class="flex-1 overflow-y-auto p-4">
    {#if isLogin}
      <button onclick={handleLogout}>登出</button>
    {:else}
      <button onclick={handleLogin}>登录</button>
    {/if}
  </div>
</div>
