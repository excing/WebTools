<script lang="ts">
  import { onMount } from 'svelte';
  let uuid = '';
  let version = 'v4';
  let copied = false;

  // 生成 UUID v4
  function generateUUIDv4() {
    // 浏览器原生 crypto API
    // 修正类型错误，使用字符串拼接
    return ('10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
    ));
  }

  function generate() {
    if (version === 'v4') {
      uuid = generateUUIDv4();
    }
    copied = false;
  }

  function copy() {
    navigator.clipboard.writeText(uuid);
    copied = true;
    setTimeout(() => copied = false, 1200);
  }

  onMount(() => {
    generate();
  });
</script>

<svelte:head>
  <title>UUID 在线生成工具 | 介绍与实现原理 - WebTools</title>
  <meta name="description" content="UUID 在线生成工具，支持 UUID v4，附详细介绍、用途、实现方式与原理说明。" />
  <meta name="keywords" content="UUID, UUID生成, 在线工具, 唯一标识, v4, JavaScript, 实现原理" />
</svelte:head>

<main class="container">
  <section class="tool-section">
    <h1>UUID 在线生成工具</h1>
    <div class="uuid-box">
      <input class="uuid-input" type="text" readonly bind:value={uuid} aria-label="生成的UUID" />
      <button class="copy-btn" on:click={copy} aria-label="复制UUID">{copied ? '已复制' : '复制'}</button>
      <button class="gen-btn" on:click={generate} aria-label="重新生成UUID">重新生成</button>
    </div>
    <div class="uuid-version">
      <label>
        <input type="radio" bind:group={version} value="v4" checked />
        UUID v4
      </label>
      <!-- 预留其他版本扩展 -->
    </div>
  </section>

  <section class="desc-section">
    <h2>什么是 UUID？</h2>
    <p>
      UUID（Universally Unique Identifier，通用唯一识别码）是一种 128 位长的标识符，通常以 32 个十六进制数字表示，分为五段，形式如：<code>xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx</code>。UUID 广泛用于数据库主键、分布式系统、会话标识等场景，确保全局唯一性。
    </p>
    <h3>UUID 的版本</h3>
    <ul>
      <li><b>UUID v1</b>：基于时间戳和节点（通常是 MAC 地址）生成。</li>
      <li><b>UUID v3</b>：基于命名空间和名称的 MD5 哈希。</li>
      <li><b>UUID v4</b>：基于随机数生成，最常用，碰撞概率极低。</li>
      <li><b>UUID v5</b>：基于命名空间和名称的 SHA-1 哈希。</li>
    </ul>
    <h3>UUID v4 的实现原理</h3>
    <p>
      UUID v4 通过高质量的伪随机数生成 122 位数据，剩余 6 位用于版本和变体标识。现代浏览器可用 <code>crypto.getRandomValues</code> 生成安全随机数。
    </p>
    <pre><code>{`function generateUUIDv4() {
    // 浏览器原生 crypto API
    // 修正类型错误，使用字符串拼接
    return ('10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
        (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
    ));
}`}</code></pre>
    <p>
      该实现方式简洁高效，适合前端直接生成 UUID v4。
    </p>
    <h3>UUID 的应用场景</h3>
    <ul>
      <li>数据库主键、唯一标识</li>
      <li>分布式系统中的对象标识</li>
      <li>会话、令牌、API Key 等安全场景</li>
      <li>文件名、事务追踪等需唯一性的场合</li>
    </ul>
    <h3>注意事项</h3>
    <ul>
      <li>UUID v4 基于随机数，理论上存在极小概率碰撞，但实际应用中可忽略。</li>
      <li>如需可追溯性或顺序性，可考虑 v1 或其他方案。</li>
    </ul>
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
  .uuid-version {
    margin-top: 0.8rem;
    font-size: 1rem;
    color: #666;
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
    h1 {
      font-size: 1.3rem;
    }
    h2 {
      font-size: 1.1rem;
    }
  }
</style>
