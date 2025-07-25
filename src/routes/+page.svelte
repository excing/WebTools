<script lang="ts">
  // 根据 tools 绘制 UI 跳转
  const tools = [
    {
      name: "Auth",
      description: "Firebase Authentication",
      href: "/ft/auth",
      tools: [
        {
          name: "Google",
          description: "Google Authentication",
          href: "/ft/auth/google",
        },
      ],
    },
    {
      name: "FCM",
      description: "Firebase Cloud Messaging",
      href: "/ft/fcm",
      tools: [
        {
          name: "Device",
          description: "Device to Device Messaging",
          href: "/ft/fcm/device",
        },
        {
          name: "Topics",
          description: "Device to Topics Messaging",
          href: "/ft/fcm/topics",
        },
      ],
    },
    {
      name: "Tools",
      description: "Local tools",
      href: "/tools",
      tools: [
        {
          name: "UUID",
          description: "Generate UUID",
          href: "/tools/uuid",
        },
      ],
    },
  ];
</script>

<!-- 响应式 UI -->
<div class="flex flex-col h-screen">
  <div class="flex-1 overflow-y-auto p-4">
    {#if tools}
      {#each tools as tool}
        <div class="mb-4">
          <h2 class="text-2xl font-bold">{tool.name}</h2>
          <p class="text-gray-600">{tool.description}</p>
          <ul class="list-disc list-inside">
            {#each tool.tools as subTool}
              <li>
                <a href={subTool.href} class="text-blue-500 hover:underline"
                  >{subTool.name}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    {/if}
  </div>
</div>
