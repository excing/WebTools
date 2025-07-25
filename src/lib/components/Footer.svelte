<script lang="ts">
  import { trackUserInteraction } from '$lib/analytics';

  function handleLinkClick(linkName: string) {
    trackUserInteraction('click', 'footer_link', linkName);
  }
</script>

<footer class="bg-gray-900 text-white">
  <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- 公司信息 -->
      <div class="col-span-1 md:col-span-2">
        <h3 class="text-lg font-semibold mb-4">WebTools</h3>
        <p class="text-gray-300 text-sm leading-relaxed mb-4">
          专业的在线工具集合，包含Firebase认证、消息推送、UUID生成等实用工具。
          我们致力于为开发者提供高效、安全的在线工具服务。
        </p>
        <div class="flex space-x-4">
          <a 
            href="https://github.com" 
            class="text-gray-400 hover:text-white transition-colors"
            onclick={() => handleLinkClick('github')}
            aria-label="GitHub"
          >
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a 
            href="https://twitter.com" 
            class="text-gray-400 hover:text-white transition-colors"
            onclick={() => handleLinkClick('twitter')}
            aria-label="Twitter"
          >
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- 工具链接 -->
      <div>
        <h3 class="text-lg font-semibold mb-4">工具</h3>
        <ul class="space-y-2">
          <li>
            <a 
              href="/ft/auth/google" 
              class="text-gray-300 hover:text-white text-sm transition-colors"
              onclick={() => handleLinkClick('auth_tools')}
            >
              Firebase认证
            </a>
          </li>
          <li>
            <a 
              href="/ft/fcm/topics" 
              class="text-gray-300 hover:text-white text-sm transition-colors"
              onclick={() => handleLinkClick('fcm_tools')}
            >
              消息推送
            </a>
          </li>
          <li>
            <a 
              href="/ft/firestore" 
              class="text-gray-300 hover:text-white text-sm transition-colors"
              onclick={() => handleLinkClick('firestore_tools')}
            >
              Firestore数据库
            </a>
          </li>
          <li>
            <a 
              href="/tools/uuid" 
              class="text-gray-300 hover:text-white text-sm transition-colors"
              onclick={() => handleLinkClick('uuid_tools')}
            >
              UUID生成器
            </a>
          </li>
        </ul>
      </div>

      <!-- 法律信息 -->
      <div>
        <h3 class="text-lg font-semibold mb-4">法律信息</h3>
        <ul class="space-y-2">
          <li>
            <a 
              href="/cookie-policy" 
              class="text-gray-300 hover:text-white text-sm transition-colors"
              onclick={() => handleLinkClick('cookie_policy')}
            >
              Cookie政策
            </a>
          </li>
          <li>
            <a 
              href="/cookie-settings" 
              class="text-gray-300 hover:text-white text-sm transition-colors"
              onclick={() => handleLinkClick('cookie_settings')}
            >
              Cookie设置
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- 底部版权信息 -->
    <div class="mt-8 pt-8 border-t border-gray-800">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="text-gray-400 text-sm">
          © 2024 WebTools. 保留所有权利。
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-6">
          <span class="text-gray-400 text-sm">
            遵循GDPR规范
          </span>
          <div class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-400 text-sm">SSL安全</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>
