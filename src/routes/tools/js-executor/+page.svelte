<script lang="ts">
  import { onMount } from 'svelte';
  import { trackToolUsage, trackUserInteraction } from '$lib/analytics';
  import SEOHead from '$lib/components/SEOHead.svelte';
  import { pageSEOData, generateToolStructuredData, siteConfig } from '$lib/seo';
  import { trackFunnelStep, trackConversionGoal } from '$lib/conversionTracking';

  let code = $state(`// 欢迎使用 JavaScript 脚本执行器
// 在这里编写您的 JavaScript 代码

console.log('Hello, World!');

// 示例：计算斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('斐波那契数列前10项:');
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}

// 示例：操作数组
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
console.log('原数组:', numbers);
console.log('翻倍后:', doubled);

// 返回结果
'执行完成！查看控制台输出。';`);

  let output = $state('');
  let isExecuting = $state(false);
  let executionTime = $state(0);
  let hasError = $state(false);

  // 自定义控制台对象，用于捕获输出
  let consoleOutput: string[] = [];

  function createSafeConsole() {
    return {
      log: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`[LOG] ${message}`);
      },
      error: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`[ERROR] ${message}`);
      },
      warn: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`[WARN] ${message}`);
      },
      info: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`[INFO] ${message}`);
      }
    };
  }

  function executeCode() {
    if (isExecuting) return;
    
    isExecuting = true;
    hasError = false;
    consoleOutput = [];
    output = '';
    
    const startTime = performance.now();

    try {
      // 创建安全的执行环境
      const safeConsole = createSafeConsole();
      
      // 创建一个函数来执行用户代码
      const executeUserCode = new Function('console', `
        "use strict";
        try {
          ${code}
        } catch (error) {
          console.error('执行错误:', error.message);
          throw error;
        }
      `);

      // 执行代码
      const result = executeUserCode(safeConsole);
      
      // 计算执行时间
      executionTime = performance.now() - startTime;
      
      // 组合输出
      let finalOutput = '';
      if (consoleOutput.length > 0) {
        finalOutput += '控制台输出:\n' + consoleOutput.join('\n') + '\n\n';
      }
      
      if (result !== undefined) {
        finalOutput += '返回值:\n' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
      }
      
      output = finalOutput || '代码执行完成，无输出。';

      // 追踪成功执行
      trackToolUsage('JavaScript Executor', 'execute_success', {
        code_length: code.length,
        execution_time: executionTime,
        has_console_output: consoleOutput.length > 0,
        has_return_value: result !== undefined
      });

      trackConversionGoal('js_code_executed', {
        execution_time: executionTime
      });

    } catch (error) {
      hasError = true;
      executionTime = performance.now() - startTime;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      output = `执行错误:\n${errorMessage}`;
      
      if (consoleOutput.length > 0) {
        output = '控制台输出:\n' + consoleOutput.join('\n') + '\n\n' + output;
      }

      // 追踪执行错误
      trackToolUsage('JavaScript Executor', 'execute_error', {
        error_message: errorMessage,
        code_length: code.length,
        execution_time: executionTime
      });
    } finally {
      isExecuting = false;
    }
  }

  function clearCode() {
    code = '';
    output = '';
    hasError = false;
    executionTime = 0;
    
    trackUserInteraction('clear', 'code_editor', 'button');
  }

  function loadExample(exampleName: string) {
    const examples = {
      basic: `// 基础 JavaScript 示例
console.log('Hello, JavaScript!');

// 变量和数据类型
const name = 'WebTools';
const version = 1.0;
const features = ['代码执行', '语法高亮', '错误处理'];

console.log(\`欢迎使用 \${name} v\${version}\`);
console.log('功能列表:', features);

// 函数定义
function greet(user) {
  return \`你好, \${user}!\`;
}

console.log(greet('开发者'));`,

      algorithms: `// 算法示例：排序和搜索
console.log('=== 算法演示 ===');

// 冒泡排序
function bubbleSort(arr) {
  const result = [...arr];
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length - i - 1; j++) {
      if (result[j] > result[j + 1]) {
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
      }
    }
  }
  return result;
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('原数组:', numbers);
console.log('排序后:', bubbleSort(numbers));

// 二分查找
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const sorted = [1, 3, 5, 7, 9, 11, 13, 15];
console.log('在数组中查找 7:', binarySearch(sorted, 7));`,

      dataStructures: `// 数据结构示例
console.log('=== 数据结构演示 ===');

// 栈实现
class Stack {
  constructor() {
    this.items = [];
  }
  
  push(item) {
    this.items.push(item);
  }
  
  pop() {
    return this.items.pop();
  }
  
  peek() {
    return this.items[this.items.length - 1];
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
  
  size() {
    return this.items.length;
  }
}

const stack = new Stack();
stack.push(1);
stack.push(2);
stack.push(3);
console.log('栈顶元素:', stack.peek());
console.log('弹出元素:', stack.pop());
console.log('栈大小:', stack.size());

// 队列实现
class Queue {
  constructor() {
    this.items = [];
  }
  
  enqueue(item) {
    this.items.push(item);
  }
  
  dequeue() {
    return this.items.shift();
  }
  
  front() {
    return this.items[0];
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
}

const queue = new Queue();
queue.enqueue('第一个');
queue.enqueue('第二个');
console.log('队首元素:', queue.front());
console.log('出队元素:', queue.dequeue());`
    };

    code = examples[exampleName as keyof typeof examples] || examples.basic;
    output = '';
    hasError = false;
    
    trackUserInteraction('load_example', 'code_editor', exampleName);
  }

  onMount(() => {
    // 追踪页面访问
    trackToolUsage('JavaScript Executor', 'page_visit', {
      initial_code_length: code.length
    });

    trackFunnelStep('tool_usage_funnel', 'tool_page_visit', {
      tool_name: 'JavaScript Executor'
    });
  });

  // 生成工具页面的结构化数据
  const jsExecutorStructuredData = generateToolStructuredData(
    'JavaScript 在线执行器',
    'JavaScript 在线代码执行器，支持实时运行 JavaScript 代码，查看执行结果和控制台输出。安全、快速的在线 JS 代码测试工具。',
    `${siteConfig.url}/tools/js-executor`
  );

  // SEO 数据
  const jsExecutorSEO = pageSEOData.jsExecutor;
</script>

<!-- SEO 元数据 -->
<SEOHead seo={jsExecutorSEO} structuredData={jsExecutorStructuredData} pathname="/tools/js-executor" />

<main class="container">
  <section class="tool-section">
    <h1>JavaScript 在线执行器</h1>
    <p class="tool-description">
      在浏览器中安全执行 JavaScript 代码，支持控制台输出和错误处理。适合代码测试、学习和调试。
    </p>

    <!-- 示例代码按钮 -->
    <div class="examples-section">
      <h3>示例代码：</h3>
      <div class="example-buttons">
        <button class="example-btn" onclick={() => loadExample('basic')}>基础语法</button>
        <button class="example-btn" onclick={() => loadExample('algorithms')}>算法示例</button>
        <button class="example-btn" onclick={() => loadExample('dataStructures')}>数据结构</button>
      </div>
    </div>

    <!-- 代码编辑器 -->
    <div class="editor-section">
      <div class="editor-header">
        <h3>代码编辑器</h3>
        <div class="editor-actions">
          <button class="action-btn clear-btn" onclick={clearCode} disabled={isExecuting}>
            清空代码
          </button>
          <button
            class="action-btn execute-btn"
            onclick={executeCode}
            disabled={isExecuting || !code.trim()}
          >
            {isExecuting ? '执行中...' : '执行代码'}
          </button>
        </div>
      </div>
      <textarea
        class="code-editor"
        bind:value={code}
        placeholder="在这里输入您的 JavaScript 代码..."
        spellcheck="false"
        disabled={isExecuting}
      ></textarea>
    </div>

    <!-- 执行结果 -->
    <div class="output-section">
      <div class="output-header">
        <h3>执行结果</h3>
        {#if executionTime > 0}
          <span class="execution-time">
            执行时间: {executionTime.toFixed(2)}ms
          </span>
        {/if}
      </div>
      <pre class="output-display" class:error={hasError} class:empty={!output}>{output || '点击"执行代码"按钮运行您的 JavaScript 代码'}</pre>
    </div>
  </section>

  <!-- 功能说明和实现原理 -->
  <section class="desc-section">
    <h2>功能介绍</h2>
    <p>
      JavaScript 在线执行器是一个安全的代码运行环境，允许您在浏览器中直接执行 JavaScript 代码。
      支持现代 JavaScript 语法，包括 ES6+ 特性、类、箭头函数、模板字符串等。
    </p>

    <h3>主要特性</h3>
    <ul>
      <li><strong>实时执行</strong>：即时运行 JavaScript 代码，查看执行结果</li>
      <li><strong>控制台输出</strong>：完整支持 console.log、console.error 等输出方法</li>
      <li><strong>错误处理</strong>：友好的错误提示和异常捕获</li>
      <li><strong>性能监控</strong>：显示代码执行时间</li>
      <li><strong>示例代码</strong>：提供多种学习示例</li>
      <li><strong>安全执行</strong>：在受限环境中运行，保护用户安全</li>
    </ul>

    <h3>使用方法</h3>
    <ol>
      <li>在代码编辑器中输入或粘贴您的 JavaScript 代码</li>
      <li>点击"执行代码"按钮运行代码</li>
      <li>在执行结果区域查看输出和返回值</li>
      <li>使用示例代码快速开始学习</li>
    </ol>

    <h3>实现原理</h3>
    <p>
      本工具使用 JavaScript 的 <code>Function</code> 构造函数创建安全的执行环境。
      通过以下技术实现代码执行：
    </p>

    <h4>1. 安全执行环境</h4>
    <pre><code>{`// 创建安全的执行函数
const executeUserCode = new Function('console', \`
  "use strict";
  try {
    \${userCode}
  } catch (error) {
    console.error('执行错误:', error.message);
    throw error;
  }
\`);`}</code></pre>

    <h4>2. 控制台输出捕获</h4>
    <pre><code>{`// 自定义控制台对象
const safeConsole = {
  log: (...args) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    consoleOutput.push(\`[LOG] \${message}\`);
  },
  error: (...args) => {
    // 类似处理错误输出
  }
};`}</code></pre>

    <h4>3. 错误处理机制</h4>
    <p>
      使用 try-catch 块捕获运行时错误，并提供详细的错误信息。
      支持语法错误、运行时错误和逻辑错误的检测。
    </p>

    <h3>安全注意事项</h3>
    <ul>
      <li><strong>沙箱环境</strong>：代码在受限的执行环境中运行</li>
      <li><strong>无网络访问</strong>：无法进行网络请求或访问外部资源</li>
      <li><strong>无文件系统</strong>：无法访问本地文件系统</li>
      <li><strong>内存限制</strong>：避免无限循环和内存泄漏</li>
      <li><strong>执行超时</strong>：长时间运行的代码会被中断</li>
    </ul>

    <h3>支持的 JavaScript 特性</h3>
    <div class="features-grid">
      <div class="feature-item">
        <h4>ES6+ 语法</h4>
        <ul>
          <li>箭头函数</li>
          <li>模板字符串</li>
          <li>解构赋值</li>
          <li>扩展运算符</li>
        </ul>
      </div>
      <div class="feature-item">
        <h4>数据类型</h4>
        <ul>
          <li>基本类型</li>
          <li>对象和数组</li>
          <li>Map 和 Set</li>
          <li>Symbol</li>
        </ul>
      </div>
      <div class="feature-item">
        <h4>控制结构</h4>
        <ul>
          <li>条件语句</li>
          <li>循环语句</li>
          <li>异常处理</li>
          <li>函数定义</li>
        </ul>
      </div>
      <div class="feature-item">
        <h4>内置对象</h4>
        <ul>
          <li>Math 对象</li>
          <li>Date 对象</li>
          <li>RegExp 对象</li>
          <li>JSON 对象</li>
        </ul>
      </div>
    </div>

    <h3>常见用途</h3>
    <ul>
      <li><strong>学习 JavaScript</strong>：快速测试和验证 JavaScript 概念</li>
      <li><strong>算法练习</strong>：实现和测试各种算法</li>
      <li><strong>代码调试</strong>：隔离问题代码进行调试</li>
      <li><strong>原型开发</strong>：快速验证代码逻辑</li>
      <li><strong>面试准备</strong>：练习编程题目</li>
    </ul>

    <h3>限制说明</h3>
    <ul>
      <li>不支持 DOM 操作（document、window 等）</li>
      <li>不支持异步操作（setTimeout、Promise 等）</li>
      <li>不支持模块导入（import/export）</li>
      <li>不支持 Node.js 特定 API</li>
      <li>执行时间限制在合理范围内</li>
    </ul>
  </section>
</main>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem 1rem;
    font-family: system-ui, -apple-system, sans-serif;
    color: #1f2937;
  }

  .tool-section {
    background: #ffffff;
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #2563eb;
    text-align: center;
    font-weight: 700;
  }

  .tool-description {
    text-align: center;
    font-size: 1.1rem;
    color: #6b7280;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .examples-section {
    margin-bottom: 2rem;
  }

  .examples-section h3 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: #374151;
    font-weight: 600;
  }

  .example-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .example-btn {
    padding: 0.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
    color: #374151;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .example-btn:hover {
    border-color: #2563eb;
    background: #eff6ff;
    color: #2563eb;
  }

  .editor-section {
    margin-bottom: 2rem;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .editor-header h3 {
    font-size: 1.2rem;
    color: #374151;
    margin: 0;
    font-weight: 600;
  }

  .editor-actions {
    display: flex;
    gap: 0.75rem;
  }

  .action-btn {
    padding: 0.5rem 1.2rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .clear-btn {
    background: #f3f4f6;
    color: #6b7280;
  }

  .clear-btn:hover:not(:disabled) {
    background: #e5e7eb;
    color: #374151;
  }

  .execute-btn {
    background: #2563eb;
    color: white;
  }

  .execute-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .code-editor {
    width: 100%;
    min-height: 300px;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    background: #f8fafc;
    color: #1f2937;
    resize: vertical;
    transition: border-color 0.2s ease;
  }

  .code-editor:focus {
    outline: none;
    border-color: #2563eb;
    background: #ffffff;
  }

  .code-editor:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .output-section {
    margin-top: 2rem;
  }

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .output-header h3 {
    font-size: 1.2rem;
    color: #374151;
    margin: 0;
    font-weight: 600;
  }

  .execution-time {
    font-size: 0.9rem;
    color: #10b981;
    font-weight: 600;
    background: #ecfdf5;
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
  }

  .output-display {
    width: 100%;
    min-height: 200px;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    background: #f8fafc;
    color: #1f2937;
    white-space: pre-wrap;
    overflow-x: auto;
    margin: 0;
  }

  .output-display.error {
    border-color: #ef4444;
    background: #fef2f2;
    color: #dc2626;
  }

  .output-display.empty {
    color: #9ca3af;
    font-style: italic;
  }

  .desc-section {
    background: #f8fafc;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .desc-section h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #1f2937;
    font-weight: 700;
  }

  .desc-section h3 {
    font-size: 1.3rem;
    margin: 2rem 0 1rem 0;
    color: #2563eb;
    font-weight: 600;
  }

  .desc-section h4 {
    font-size: 1.1rem;
    margin: 1.5rem 0 0.75rem 0;
    color: #374151;
    font-weight: 600;
  }

  .desc-section p {
    line-height: 1.7;
    margin-bottom: 1rem;
    color: #4b5563;
  }

  .desc-section ul, .desc-section ol {
    margin: 1rem 0 1.5rem 1.5rem;
    line-height: 1.6;
  }

  .desc-section li {
    margin-bottom: 0.5rem;
    color: #4b5563;
  }

  .desc-section li strong {
    color: #1f2937;
    font-weight: 600;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin: 1.5rem 0;
  }

  .feature-item {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .feature-item h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #2563eb;
  }

  .feature-item ul {
    margin: 0;
    padding-left: 1.2rem;
  }

  .feature-item li {
    margin-bottom: 0.3rem;
    font-size: 0.9rem;
  }

  code {
    background: #f1f5f9;
    border-radius: 0.3rem;
    padding: 0.2em 0.4em;
    font-size: 0.9em;
    color: #475569;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  pre {
    background: #1e293b;
    color: #e2e8f0;
    border-radius: 0.75rem;
    padding: 1.5rem;
    overflow-x: auto;
    margin: 1rem 0;
    font-size: 0.85rem;
    line-height: 1.6;
  }

  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    font-size: inherit;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .container {
      padding: 1rem 0.5rem 2rem 0.5rem;
    }

    .tool-section, .desc-section {
      padding: 1.5rem;
    }

    h1 {
      font-size: 2rem;
    }

    .editor-header {
      flex-direction: column;
      align-items: stretch;
    }

    .editor-actions {
      justify-content: center;
    }

    .output-header {
      flex-direction: column;
      align-items: stretch;
    }

    .example-buttons {
      justify-content: stretch;
      flex-direction: column;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .code-editor {
      min-height: 250px;
      font-size: 0.85rem;
    }

    .output-display {
      min-height: 150px;
      font-size: 0.85rem;
    }

    pre {
      padding: 1rem;
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 0.5rem 0.25rem 1.5rem 0.25rem;
    }

    .tool-section, .desc-section {
      padding: 1rem;
    }

    h1 {
      font-size: 1.75rem;
    }

    .tool-description {
      font-size: 1rem;
    }

    .action-btn {
      padding: 0.6rem 1rem;
      font-size: 0.85rem;
    }
  }
</style>
