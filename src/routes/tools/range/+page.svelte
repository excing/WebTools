<script lang="ts">
  import { onMount } from "svelte";
  import { trackToolUsage } from "$lib/analytics";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import {
    pageSEOData,
    generateToolStructuredData,
    siteConfig,
  } from "$lib/seo";
  import { trackFunnelStep } from "$lib/conversionTracking";

  let sampleText = $state(`这是一段示例文本，用于演示 Range 对象的各种操作。
Range 对象是 DOM API 中用于表示文档中一个连续区域的接口。
您可以选择文本，然后使用下面的工具来操作 Range 对象。
Range 可以用于文本选择、内容提取、DOM 节点操作等多种场景。`);

  let rangeInfo = $state("");
  let extractedContent = $state("");
  let currentRange: Range | null = null;
  let operationResult = $state("");

  // 获取当前选择的 Range
  function getCurrentSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      currentRange = selection.getRangeAt(0);
      updateRangeInfo();

      trackToolUsage("Range Tool", "get_selection", {
        has_selection: !currentRange.collapsed,
        selection_length: currentRange.toString().length,
      });
    } else {
      rangeInfo = "没有选择任何内容";
      currentRange = null;
    }
  }

  function getClientRects(range: Range) {
    const rects = range.getClientRects();
    const coordinates = [];
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      coordinates.push({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
    return JSON.stringify(coordinates);
  }

  // 更新 Range 信息显示
  function updateRangeInfo() {
    if (!currentRange) return;

    const info = {
      collapsed: currentRange.collapsed,
      startOffset: currentRange.startOffset,
      endOffset: currentRange.endOffset,
      commonAncestor: currentRange.commonAncestorContainer.nodeName,
      selectedText: currentRange.toString(),
      textLength: currentRange.toString().length,
    };

    rangeInfo = `Range 信息:
- 区域: ${getClientRects(currentRange)}
- 是否折叠: ${info.collapsed ? "是" : "否"}
- 起始偏移: ${info.startOffset}
- 结束偏移: ${info.endOffset}
- 公共祖先: ${info.commonAncestor}
- 选中文本长度: ${info.textLength} 字符
- 选中内容: "${info.selectedText}"`;
  }

  // 创建新的 Range
  function createRange() {
    const textElement = document.getElementById("sample-text");
    if (!textElement) return;

    const range = document.createRange();
    const textNode = textElement.firstChild;

    if (textNode) {
      // 选择前20个字符
      range.setStart(textNode, 2);
      range.setEnd(textNode, Math.min(20, textNode.textContent?.length || 0));

      // 应用选择
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      currentRange = range;
      updateRangeInfo();
      operationResult = "已创建新的 Range 并选择前20个字符";

      trackToolUsage("Range Tool", "create_range", {
        range_length: range.toString().length,
      });
    }
  }

  // 提取选中内容
  function extractContent() {
    if (!currentRange) {
      operationResult = "请先选择文本或创建 Range";
      return;
    }

    extractedContent = currentRange.toString();
    operationResult = `已提取内容: "${extractedContent}"`;

    trackToolUsage("Range Tool", "extract_content", {
      content_length: extractedContent.length,
    });
  }

  // 克隆 Range 内容
  function cloneContents() {
    if (!currentRange) {
      operationResult = "请先选择文本或创建 Range";
      return;
    }

    const clonedFragment = currentRange.cloneContents();
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(clonedFragment);

    extractedContent = tempDiv.innerHTML;
    operationResult = `已克隆内容 (HTML): ${extractedContent}`;

    trackToolUsage("Range Tool", "clone_contents", {
      html_length: extractedContent.length,
    });
  }

  // 删除选中内容
  function deleteContents() {
    if (!currentRange) {
      operationResult = "请先选择文本或创建 Range";
      return;
    }

    if (currentRange.collapsed) {
      operationResult = "Range 已折叠，没有内容可删除";
      return;
    }

    const deletedText = currentRange.toString();
    currentRange.deleteContents();
    operationResult = `已删除内容: "${deletedText}"`;

    // 更新显示
    getCurrentSelection();

    trackToolUsage("Range Tool", "delete_contents", {
      deleted_length: deletedText.length,
    });
  }

  // 插入文本
  function insertText() {
    if (!currentRange) {
      operationResult = "请先选择文本或创建 Range";
      return;
    }

    const textToInsert = "[插入的文本]";
    const textNode = document.createTextNode(textToInsert);

    currentRange.deleteContents();
    currentRange.insertNode(textNode);

    operationResult = `已插入文本: "${textToInsert}"`;

    trackToolUsage("Range Tool", "insert_text", {
      inserted_text: textToInsert,
    });
  }

  // 重置示例文本
  function resetText() {
    sampleText = `这是一段示例文本，用于演示 Range 对象的各种操作。
Range 对象是 DOM API 中用于表示文档中一个连续区域的接口。
您可以选择文本，然后使用下面的工具来操作 Range 对象。
Range 可以用于文本选择、内容提取、DOM 节点操作等多种场景。`;

    rangeInfo = "";
    extractedContent = "";
    operationResult = "已重置示例文本";
    currentRange = null;

    trackToolUsage("Range Tool", "reset_text");
  }

  onMount(() => {
    // 追踪页面访问
    trackToolUsage("Range Tool", "page_visit");
    trackFunnelStep("tool_usage_funnel", "tool_page_visit", {
      tool_name: "Range Tool",
    });
  });

  // 生成工具页面的结构化数据
  const rangeToolStructuredData = generateToolStructuredData(
    "Range 对象操作工具",
    "Range 对象在线操作工具，支持文本选择、Range 创建、文档片段操作等功能。学习和测试 DOM Range API 的专业工具。",
    `${siteConfig.url}/tools/range`,
  );
</script>

<!-- SEO 元数据 -->
<SEOHead
  seo={pageSEOData.rangeTool}
  structuredData={rangeToolStructuredData}
  pathname="/tools/range"
/>

<main class="container">
  <section class="tool-section">
    <h1>Range 对象操作工具</h1>

    <!-- 示例文本区域 -->
    <div class="text-area-container">
      <label for="sample-text" class="text-label"
        >示例文本 (请选择文本进行操作):</label
      >
      <span
        id="sample-text"
        role="textbox"
        tabindex="0"
        aria-label="可编辑的示例文本，用于演示 Range 操作"
        onmouseup={getCurrentSelection}
        onkeyup={getCurrentSelection}>{sampleText}</span
      >
    </div>

    <!-- 操作按钮 -->
    <div class="button-grid">
      <button class="action-btn primary" onclick={getCurrentSelection}
        >获取当前选择</button
      >
      <button class="action-btn secondary" onclick={createRange}
        >创建新 Range</button
      >
      <button class="action-btn success" onclick={extractContent}
        >提取内容</button
      >
      <button class="action-btn info" onclick={cloneContents}>克隆内容</button>
      <button class="action-btn warning" onclick={deleteContents}
        >删除内容</button
      >
      <button class="action-btn danger" onclick={insertText}>插入文本</button>
      <button class="action-btn neutral" onclick={resetText}>重置文本</button>
    </div>

    <!-- Range 信息显示 -->
    {#if rangeInfo}
      <div class="info-box">
        <h3>Range 信息</h3>
        <pre class="range-info">{rangeInfo}</pre>
      </div>
    {/if}

    <!-- 提取的内容显示 -->
    {#if extractedContent}
      <div class="content-box">
        <h3>提取的内容</h3>
        <div class="extracted-content">{extractedContent}</div>
      </div>
    {/if}

    <!-- 操作结果显示 -->
    {#if operationResult}
      <div class="result-box">
        <h3>操作结果</h3>
        <p class="operation-result">{operationResult}</p>
      </div>
    {/if}
  </section>

  <section class="desc-section">
    <h2>什么是 Range 对象？</h2>
    <p>
      Range 对象是 DOM API
      中的一个重要接口，用于表示文档中的一个连续区域。它可以包含文本节点、元素节点或两者的组合。Range
      对象提供了强大的文档操作能力，是现代 Web
      开发中处理文本选择和内容操作的核心工具。
    </p>

    <h3>Range 对象的主要特性</h3>
    <ul>
      <li>
        <strong>边界定义</strong>：通过起始点和结束点定义一个连续的文档区域
      </li>
      <li>
        <strong>内容操作</strong>：可以提取、删除、插入或替换 Range 内的内容
      </li>
      <li><strong>节点遍历</strong>：能够遍历 Range 内包含的所有 DOM 节点</li>
      <li><strong>文档片段</strong>：可以创建包含 Range 内容的文档片段</li>
    </ul>

    <h3>创建 Range 对象的方法</h3>
    <h4>1. 使用 document.createRange()</h4>
    <pre><code
        >// 创建一个新的空 Range
const range = document.createRange();

// 设置 Range 的起始和结束位置
range.setStart(startNode, startOffset);
range.setEnd(endNode, endOffset);</code
      ></pre>

    <h4>2. 从用户选择获取</h4>
    <pre><code
        >{`// 获取用户当前选择的 Range
const selection = window.getSelection();
if (selection && selection.rangeCount > 0) {
  const range = selection.getRangeAt(0);
}`}</code
      ></pre>

    <h3>Range 对象的常用方法</h3>
    <ul>
      <li><code>setStart(node, offset)</code> - 设置 Range 的起始位置</li>
      <li><code>setEnd(node, offset)</code> - 设置 Range 的结束位置</li>
      <li><code>selectNode(node)</code> - 选择整个节点</li>
      <li><code>selectNodeContents(node)</code> - 选择节点的内容</li>
      <li><code>cloneContents()</code> - 克隆 Range 内容为文档片段</li>
      <li><code>extractContents()</code> - 提取并移除 Range 内容</li>
      <li><code>deleteContents()</code> - 删除 Range 内容</li>
      <li><code>insertNode(node)</code> - 在 Range 起始位置插入节点</li>
    </ul>

    <h3>Range 对象的应用场景</h3>
    <ul>
      <li><strong>文本编辑器</strong>：实现文本选择、格式化、插入等功能</li>
      <li><strong>内容提取</strong>：从网页中提取特定区域的内容</li>
      <li><strong>搜索高亮</strong>：高亮显示搜索结果</li>
      <li><strong>拖拽操作</strong>：实现文本或元素的拖拽功能</li>
      <li><strong>复制粘贴</strong>：处理剪贴板操作</li>
      <li><strong>注释系统</strong>：为文档添加注释或标记</li>
    </ul>

    <h3>Range 对象的重要属性</h3>
    <ul>
      <li>
        <code>collapsed</code> - 布尔值，表示 Range 是否折叠（起始点和结束点相同）
      </li>
      <li><code>startContainer</code> - Range 起始位置的容器节点</li>
      <li><code>endContainer</code> - Range 结束位置的容器节点</li>
      <li><code>startOffset</code> - 在起始容器中的偏移量</li>
      <li><code>endOffset</code> - 在结束容器中的偏移量</li>
      <li>
        <code>commonAncestorContainer</code> - 包含整个 Range 的最近公共祖先节点
      </li>
    </ul>

    <h3>实际应用示例</h3>
    <pre><code
        >{`// 高亮搜索结果
function highlightSearchTerm(searchTerm) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent;
    if (text) {
      const index = text.indexOf(searchTerm);

      if (index !== -1) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + searchTerm.length);

        const span = document.createElement('span');
        span.className = 'highlight';
        range.surroundContents(span);
      }
    }
  }
}`}</code
      ></pre>

    <h3>注意事项</h3>
    <ul>
      <li>Range 对象在 DOM 结构发生变化时可能失效</li>
      <li>跨框架（iframe）的 Range 操作需要特殊处理</li>
      <li>某些操作可能会影响用户的当前选择状态</li>
      <li>在移动设备上，Range 操作的行为可能与桌面端不同</li>
    </ul>
  </section>
</main>

<style>
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem 1rem;
    font-family: system-ui, sans-serif;
    color: #222;
  }

  .tool-section {
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 2px 12px 0 #0001;
    padding: 2rem 1.5rem;
    margin-bottom: 2rem;
  }

  .text-area-container {
    margin: 1.5rem 0;
  }

  .text-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .sample-text {
    width: 100%;
    min-height: 120px;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
    font-size: 1rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    outline: none;
    transition: border-color 0.2s;
  }

  .sample-text:focus {
    border-color: #3b82f6;
    background: #fff;
  }

  .button-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
    margin: 1.5rem 0;
  }

  .action-btn {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .action-btn.primary {
    background: #3b82f6;
    color: white;
  }

  .action-btn.primary:hover {
    background: #2563eb;
  }

  .action-btn.secondary {
    background: #6b7280;
    color: white;
  }

  .action-btn.secondary:hover {
    background: #4b5563;
  }

  .action-btn.success {
    background: #10b981;
    color: white;
  }

  .action-btn.success:hover {
    background: #059669;
  }

  .action-btn.info {
    background: #06b6d4;
    color: white;
  }

  .action-btn.info:hover {
    background: #0891b2;
  }

  .action-btn.warning {
    background: #f59e0b;
    color: white;
  }

  .action-btn.warning:hover {
    background: #d97706;
  }

  .action-btn.danger {
    background: #ef4444;
    color: white;
  }

  .action-btn.danger:hover {
    background: #dc2626;
  }

  .action-btn.neutral {
    background: #9ca3af;
    color: white;
  }

  .action-btn.neutral:hover {
    background: #6b7280;
  }

  .info-box,
  .content-box,
  .result-box {
    margin: 1.5rem 0;
    padding: 1rem;
    border-radius: 0.5rem;
    border-left: 4px solid;
  }

  .info-box {
    background: #eff6ff;
    border-left-color: #3b82f6;
  }

  .content-box {
    background: #f0fdf4;
    border-left-color: #10b981;
  }

  .result-box {
    background: #fefce8;
    border-left-color: #f59e0b;
  }

  .info-box h3,
  .content-box h3,
  .result-box h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .range-info {
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    margin: 0;
    white-space: pre-wrap;
    overflow-x: auto;
  }

  .extracted-content {
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    word-break: break-all;
  }

  .operation-result {
    margin: 0;
    font-size: 0.9rem;
  }

  .desc-section {
    background: #f8fafc;
    border-radius: 1rem;
    padding: 2rem 1.5rem;
    box-shadow: 0 1px 6px 0 #0001;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #2563eb;
    text-align: center;
  }

  h2 {
    font-size: 1.4rem;
    margin: 1.5rem 0 0.8rem 0;
    color: #0f172a;
  }

  h3 {
    font-size: 1.2rem;
    margin: 1.2rem 0 0.6rem 0;
    color: #2563eb;
  }

  h4 {
    font-size: 1.1rem;
    margin: 1rem 0 0.5rem 0;
    color: #374151;
  }

  ul {
    margin: 0.5rem 0 1rem 1.2rem;
    padding: 0;
    list-style: disc inside;
  }

  li {
    margin-bottom: 0.3rem;
  }

  code {
    background: #f1f5f9;
    border-radius: 0.3rem;
    padding: 0.1em 0.4em;
    font-size: 0.9em;
    color: #334155;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  }

  pre {
    background: #f1f5f9;
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
    margin: 0.5em 0 1em 0;
    font-size: 0.9rem;
  }

  pre code {
    background: none;
    padding: 0;
    font-size: inherit;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem 0.5rem 2rem 0.5rem;
    }

    .tool-section,
    .desc-section {
      padding: 1.5rem 1rem;
    }

    .button-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.6rem 0.8rem;
      font-size: 0.85rem;
    }

    h1 {
      font-size: 1.6rem;
    }

    h2 {
      font-size: 1.2rem;
    }

    h3 {
      font-size: 1.1rem;
    }

    .sample-text {
      min-height: 100px;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .button-grid {
      grid-template-columns: 1fr;
    }

    .container {
      padding: 0.5rem 0.25rem 1.5rem 0.25rem;
    }
  }
</style>
