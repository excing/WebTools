<script lang="ts">
  import { onMount } from 'svelte';
  import { nanoid } from 'nanoid';
  import { trackToolUsage, trackUserInteraction } from '$lib/analytics';
  import SEOHead from '$lib/components/SEOHead.svelte';
  import { pageSEOData, generateToolStructuredData, siteConfig } from '$lib/seo';
  import { trackFunnelStep, trackConversionGoal } from '$lib/conversionTracking';

  let generatedId = '';
  let idType = 'uuidv4';
  let copied = false;

  // --- Generator Functions ---

  function generateUUIDv4() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
    );
  }

  function generateBase64() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const binaryString = String.fromCharCode.apply(null, Array.from(randomBytes));
    return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  function generateBase36() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    let bigInt = 0n;
    for (const byte of randomBytes) {
      bigInt = (bigInt << 8n) | BigInt(byte);
    }
    return bigInt.toString(36);
  }

  function generateBase62() {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    let bigInt = 0n;
    for (const byte of randomBytes) {
      bigInt = (bigInt << 8n) | BigInt(byte);
    }
    let result = '';
    if (bigInt === 0n) return '0';
    while (bigInt > 0n) {
      result = alphabet[Number(bigInt % 62n)] + result;
      bigInt = bigInt / 62n;
    }
    return result;
  }

  function generate() {
    switch (idType) {
      case 'uuidv4':
        generatedId = generateUUIDv4();
        break;
      case 'nanoid':
        generatedId = nanoid();
        break;
      case 'base64':
        generatedId = generateBase64();
        break;
      case 'base36':
        generatedId = generateBase36();
        break;
      case 'base62':
        generatedId = generateBase62();
        break;
    }
    copied = false;

    trackToolUsage('ID Generator', 'generate', {
      type: idType,
      id_length: generatedId.length
    });
    trackFunnelStep('tool_usage_funnel', 'tool_interaction', {
      tool_name: 'ID Generator',
      action: 'generate'
    });
    trackConversionGoal('id_generated', {
      type: idType
    });
  }

  function copy() {
    navigator.clipboard.writeText(generatedId);
    copied = true;
    setTimeout(() => copied = false, 1200);

    trackUserInteraction('copy', 'id_result', 'clipboard');
    trackFunnelStep('tool_usage_funnel', 'tool_success', {
      tool_name: 'ID Generator',
      action: 'copy'
    });
    trackConversionGoal('id_copied', {
      id_length: generatedId.length
    });
    trackToolUsage('ID Generator', 'copy', {
      type: idType,
      id_value: generatedId
    });
  }

  onMount(() => {
    generate();
    trackToolUsage('ID Generator', 'page_visit', {
      initial_type: idType
    });
    trackFunnelStep('tool_usage_funnel', 'tool_page_visit', {
      tool_name: 'ID Generator'
    });
  });

  const idToolStructuredData = generateToolStructuredData(
    '在线ID生成工具',
    '免费在线生成多种格式的唯一ID，支持 UUID v4, NanoID, Base64, Base36, Base62。快速、安全、可靠。',
    `${siteConfig.url}/tools/uuid`
  );
</script>

<SEOHead seo={pageSEOData.uuidTool} structuredData={idToolStructuredData} pathname="/tools/uuid" />

<main class="container">
  <section class="tool-section">
    <h1>在线 ID 生成工具</h1>
    <div class="uuid-box">
      <input class="uuid-input" type="text" readonly bind:value={generatedId} aria-label="生成的ID" />
      <button class="copy-btn" on:click={copy} aria-label="复制ID">{copied ? '已复制' : '复制'}</button>
      <button class="gen-btn" on:click={generate} aria-label="重新生成ID">重新生成</button>
    </div>
    <div class="id-type-selector">
      <label>
        <input type="radio" bind:group={idType} value="uuidv4" on:change={generate} />
        UUID v4
      </label>
      <label>
        <input type="radio" bind:group={idType} value="nanoid" on:change={generate} />
        NanoID
      </label>
      <label>
        <input type="radio" bind:group={idType} value="base64" on:change={generate} />
        Base64
      </label>
      <label>
        <input type="radio" bind:group={idType} value="base36" on:change={generate} />
        Base36
      </label>
      <label>
        <input type="radio" bind:group={idType} value="base62" on:change={generate} />
        Base62
      </label>
    </div>
  </section>

  <section class="desc-section">
    <h2>什么是唯一ID？</h2>
    <p>
      唯一ID（Unique Identifier）是在特定范围内保证唯一的标识符。在软件开发中，它们被广泛用于识别用户、会话、交易、数据库记录等。一个好的ID生成策略对于系统的可扩展性、性能和数据完整性至关重要。
    </p>
    <h3>ID 类型介绍</h3>
    <ul>
      <li><b>UUID v4</b>: 基于 128 位随机数生成，是目前最广泛使用的 UUID 版本。它提供了极高的唯一性保证，几乎不可能发生碰撞。格式为 <code>xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx</code>。</li>
      <li><b>NanoID</b>: 一个小巧、安全、URL友好的唯一字符串ID生成器。它比 UUID 更短，同时使用更大的字符集，可以在保持较低碰撞率的同时生成更紧凑的ID。</li>
      <li><b>Base64</b>: 一种将二进制数据编码为ASCII字符串的方法。通过生成随机字节并进行 Base64 编码（URL友好型），可以创建简短的唯一ID。</li>
      <li><b>Base36</b>: 使用 26 个小写字母和 10 个数字进行编码。ID 更短，可读性较好。</li>
      <li><b>Base62</b>: 使用 10 个数字、26 个小写字母和 26 个大写字母。相比 Base36，它能用更短的长度表示更大的数值，ID 更紧凑。</li>
    </ul>
    <h3>如何选择？</h3>
    <p>
      选择哪种ID取决于你的具体需求：
    </p>
    <ul>
      <li><b>UUID v4</b>: 当你需要一个标准、成熟、几乎绝对唯一的标识符时，这是最佳选择。</li>
      <li><b>NanoID</b>: 如果你需要简短、URL友好且碰撞率低的ID，NanoID 是一个出色的现代选择。</li>
      <li><b>Base62/Base64</b>: 当你需要非常紧凑的ID，并且主要用于系统内部（如URL短链接）时，这些是不错的选择。</li>
    </ul>
    <h3>安全提示</h3>
    <p>
      本工具使用浏览器内置的 <code>crypto.getRandomValues</code> API 来生成加密安全的随机数，确保生成的ID具有足够的随机性，难以被预测。
    </p>
  </section>
</main>

<style>
  .container {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem 1rem;
    font-family: system-ui, sans-serif;
    color: #222;
  }
  .tool-section {
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 2px 12px 0 #0001;
    padding: 2rem 1.5rem 1.5rem 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
  }
  .uuid-box {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
    margin: 1.2rem 0 0.5rem 0;
  }
  .uuid-input {
    font-size: 1.2rem;
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    width: 320px;
    max-width: 100%;
    background: #f8f8fa;
    letter-spacing: 1px;
  }
  .copy-btn, .gen-btn {
    padding: 0.5rem 1.2rem;
    border: none;
    border-radius: 0.5rem;
    background: #2563eb;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .copy-btn {
    background: #10b981;
    margin-left: 0.5rem;
  }
  .copy-btn:active, .gen-btn:active {
    background: #1e40af;
  }
  .gen-btn {
    background: #2563eb;
    margin-left: 0.5rem;
  }
  .id-type-selector {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    font-size: 1rem;
    color: #666;
  }
  .id-type-selector label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
  }
  .desc-section {
    background: #f8fafc;
    border-radius: 1rem;
    padding: 2rem 1.5rem;
    box-shadow: 0 1px 6px 0 #0001;
  }
  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #2563eb;
  }
  h2 {
    font-size: 1.3rem;
    margin: 1.5rem 0 0.7rem 0;
    color: #0f172a;
  }
  h3 {
    font-size: 1.1rem;
    margin: 1.2rem 0 0.5rem 0;
    color: #2563eb;
  }
  ul {
    margin: 0.5rem 0 1rem 1.2rem;
    padding: 0;
    list-style: disc inside;
  }
  code, pre {
    background: #f1f5f9;
    border-radius: 0.3rem;
    padding: 0.1em 0.4em;
    font-size: 0.98em;
    color: #334155;
  }
  pre {
    padding: 0.8em 1em;
    overflow-x: auto;
    margin: 0.5em 0 1em 0;
  }
  @media (max-width: 600px) {
    .container {
      padding: 1rem 0.2rem 2rem 0.2rem;
    }
    .tool-section, .desc-section {
      padding: 1.2rem 0.5rem;
    }
    .uuid-input {
      width: 100%;
      font-size: 1rem;
    }
    .id-type-selector {
        gap: 0.5rem;
        justify-content: space-around;
    }
    h1 {
      font-size: 1.3rem;
    }
    h2 {
      font-size: 1.1rem;
    }
  }
</style>
