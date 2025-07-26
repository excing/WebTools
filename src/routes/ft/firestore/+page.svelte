<!-- Firestore 数据管理页面 -->

<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  // 状态管理
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let collections = $state<string[]>([]);
  let selectedCollection = $state<string>("");
  let documents = $state<any[]>([]);
  let selectedDocument = $state<any>(null);
  let showCreateCollection = $state(false);
  let showCreateDocument = $state(false);
  let showEditDocument = $state(false);

  // 表单数据
  let newCollectionName = $state("");
  let newDocumentData = $state("{}");
  let newDocumentId = $state("");
  let editDocumentData = $state("{}");

  // 分页
  let currentPage = $state(1);
  let pageSize = $state(10);
  let hasMore = $state(false);
  let lastDocumentId = $state<string | null>(null);

  // 添加消息
  function addMessage(message: string, type: 'success' | 'error' = 'success') {
    if (type === 'success') {
      success = message;
      error = null;
    } else {
      error = message;
      success = null;
    }
    
    // 3秒后自动清除消息
    setTimeout(() => {
      success = null;
      error = null;
    }, 3000);
  }

  // 获取集合列表
  async function loadCollections() {
    isLoading = true;
    try {
      const response = await fetch('/api/firestore/collections');
      const result = await response.json();
      
      if (result.success) {
        collections = result.data.collections;
        addMessage(`加载了 ${collections.length} 个集合`);
      } else {
        addMessage(result.error || '加载集合失败', 'error');
      }
    } catch (err: any) {
      addMessage(err.message || '网络错误', 'error');
    } finally {
      isLoading = false;
    }
  }

  // 获取文档列表
  async function loadDocuments(collection: string, page: number = 1) {
    if (!collection) return;
    
    isLoading = true;
    try {
      const params = new URLSearchParams({
        collection,
        limit: pageSize.toString(),
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });

      if (page > 1 && lastDocumentId) {
        params.append('startAfter', lastDocumentId);
      }

      const response = await fetch(`/api/firestore/documents?${params}`);
      const result = await response.json();
      
      if (result.success) {
        if (page === 1) {
          documents = result.data.documents;
        } else {
          documents = [...documents, ...result.data.documents];
        }
        hasMore = result.data.hasMore;
        lastDocumentId = result.data.lastDocumentId;
        currentPage = page;
        addMessage(`加载了 ${result.data.count} 个文档`);
      } else {
        addMessage(result.error || '加载文档失败', 'error');
      }
    } catch (err: any) {
      addMessage(err.message || '网络错误', 'error');
    } finally {
      isLoading = false;
    }
  }

  // 创建集合
  async function createCollection() {
    if (!newCollectionName.trim()) {
      addMessage('请输入集合名称', 'error');
      return;
    }

    let documentData;
    try {
      documentData = JSON.parse(newDocumentData);
    } catch (err) {
      addMessage('文档数据格式错误，请输入有效的 JSON', 'error');
      return;
    }

    isLoading = true;
    try {
      const response = await fetch('/api/firestore/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collectionName: newCollectionName.trim(),
          documentData,
          documentId: newDocumentId.trim() || undefined
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addMessage(`集合 ${newCollectionName} 创建成功`);
        newCollectionName = "";
        newDocumentData = "{}";
        newDocumentId = "";
        showCreateCollection = false;
        await loadCollections();
      } else {
        addMessage(result.error || '创建集合失败', 'error');
      }
    } catch (err: any) {
      addMessage(err.message || '网络错误', 'error');
    } finally {
      isLoading = false;
    }
  }

  // 创建文档
  async function createDocument() {
    if (!selectedCollection) {
      addMessage('请先选择集合', 'error');
      return;
    }

    let documentData;
    try {
      documentData = JSON.parse(newDocumentData);
    } catch (err) {
      addMessage('文档数据格式错误，请输入有效的 JSON', 'error');
      return;
    }

    isLoading = true;
    try {
      const response = await fetch('/api/firestore/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection: selectedCollection,
          documentId: newDocumentId.trim() || undefined,
          data: documentData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addMessage(`文档创建成功，ID: ${result.data.documentId}`);
        newDocumentData = "{}";
        newDocumentId = "";
        showCreateDocument = false;
        await loadDocuments(selectedCollection);
      } else {
        addMessage(result.error || '创建文档失败', 'error');
      }
    } catch (err: any) {
      addMessage(err.message || '网络错误', 'error');
    } finally {
      isLoading = false;
    }
  }

  // 更新文档
  async function updateDocument() {
    if (!selectedDocument) return;

    let documentData;
    try {
      documentData = JSON.parse(editDocumentData);
    } catch (err) {
      addMessage('文档数据格式错误，请输入有效的 JSON', 'error');
      return;
    }

    isLoading = true;
    try {
      const response = await fetch('/api/firestore/documents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection: selectedCollection,
          documentId: selectedDocument.id,
          data: documentData,
          merge: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addMessage('文档更新成功');
        showEditDocument = false;
        selectedDocument = null;
        await loadDocuments(selectedCollection);
      } else {
        addMessage(result.error || '更新文档失败', 'error');
      }
    } catch (err: any) {
      addMessage(err.message || '网络错误', 'error');
    } finally {
      isLoading = false;
    }
  }

  // 删除文档
  async function deleteDocument(documentId: string) {
    if (!confirm('确定要删除这个文档吗？此操作不可恢复。')) {
      return;
    }

    isLoading = true;
    try {
      const response = await fetch('/api/firestore/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection: selectedCollection,
          documentId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addMessage('文档删除成功');
        await loadDocuments(selectedCollection);
      } else {
        addMessage(result.error || '删除文档失败', 'error');
      }
    } catch (err: any) {
      addMessage(err.message || '网络错误', 'error');
    } finally {
      isLoading = false;
    }
  }

  // 删除集合
  async function deleteCollection(collectionName: string) {
    if (!confirm(`确定要删除集合 "${collectionName}" 吗？这将删除集合中的所有文档，此操作不可恢复。`)) {
      return;
    }

    isLoading = true;
    try {
      const response = await fetch('/api/firestore/collections', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collectionName,
          batchSize: 100
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addMessage(result.data.message);
        if (selectedCollection === collectionName) {
          selectedCollection = "";
          documents = [];
        }
        await loadCollections();
      } else {
        addMessage(result.error || '删除集合失败', 'error');
      }
    } catch (err: any) {
      addMessage(err.message || '网络错误', 'error');
    } finally {
      isLoading = false;
    }
  }

  // 选择集合
  function selectCollection(collection: string) {
    selectedCollection = collection;
    documents = [];
    currentPage = 1;
    lastDocumentId = null;
    loadDocuments(collection);
  }

  // 编辑文档
  function editDocument(doc: any) {
    selectedDocument = doc;
    editDocumentData = JSON.stringify(doc.data, null, 2);
    showEditDocument = true;
  }

  // 格式化日期
  function formatDate(date: any) {
    if (!date) return '未知';
    return new Date(date).toLocaleString('zh-CN');
  }

  // 格式化 JSON
  function formatJSON(obj: any) {
    return JSON.stringify(obj, null, 2);
  }

  // 组件挂载时加载集合
  onMount(() => {
    if (browser) {
      loadCollections();
    }
  });
</script>

<!-- 页面标题 -->
<svelte:head>
  <title>Firestore 数据管理 - WebTools</title>
  <meta name="description" content="Google Cloud Firestore 数据库管理工具" />
</svelte:head>

<!-- 主要内容区域 -->
<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Firestore 数据管理</h1>
      <p class="text-gray-600">通过服务器端 API 安全管理 Google Cloud Firestore 数据</p>
    </div>

    <!-- 成功/错误消息 -->
    {#if success}
      <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">{success}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- 集合管理面板 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">集合管理</h2>
          <button
            onclick={() => showCreateCollection = true}
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新建集合
          </button>
        </div>

        {#if isLoading && collections.length === 0}
          <div class="text-center py-8">
            <svg class="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500">正在加载集合...</p>
          </div>
        {:else if collections.length === 0}
          <div class="text-center py-8">
            <svg class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p class="text-gray-500 mb-4">暂无集合</p>
            <button
              onclick={() => showCreateCollection = true}
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              创建第一个集合
            </button>
          </div>
        {:else}
          <div class="space-y-2">
            {#each collections as collection}
              <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <button
                  onclick={() => selectCollection(collection)}
                  class="flex-1 text-left font-medium text-gray-900 hover:text-blue-600"
                  class:text-blue-600={selectedCollection === collection}
                  class:bg-blue-50={selectedCollection === collection}
                >
                  {collection}
                </button>
                <button
                  onclick={() => deleteCollection(collection)}
                  class="ml-2 text-red-600 hover:text-red-800"
                  title="删除集合"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- 文档列表面板 -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            文档列表
            {#if selectedCollection}
              <span class="text-sm font-normal text-gray-500">- {selectedCollection}</span>
            {/if}
          </h2>
          {#if selectedCollection}
            <button
              onclick={() => showCreateDocument = true}
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新建文档
            </button>
          {/if}
        </div>

        {#if !selectedCollection}
          <div class="text-center py-12">
            <svg class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500">请先选择一个集合</p>
          </div>
        {:else if isLoading && documents.length === 0}
          <div class="text-center py-12">
            <svg class="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500">正在加载文档...</p>
          </div>
        {:else if documents.length === 0}
          <div class="text-center py-12">
            <svg class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500 mb-4">集合中暂无文档</p>
            <button
              onclick={() => showCreateDocument = true}
              class="text-green-600 hover:text-green-800 font-medium"
            >
              创建第一个文档
            </button>
          </div>
        {:else}
          <div class="space-y-4">
            {#each documents as doc}
              <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <h3 class="text-sm font-medium text-gray-900 mr-2">ID: {doc.id}</h3>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        文档
                      </span>
                    </div>

                    <div class="text-xs text-gray-500 mb-3">
                      <span class="mr-4">创建: {formatDate(doc.createTime)}</span>
                      <span>更新: {formatDate(doc.updateTime)}</span>
                    </div>

                    <div class="bg-gray-50 rounded p-3">
                      <pre class="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">{formatJSON(doc.data)}</pre>
                    </div>
                  </div>

                  <div class="ml-4 flex space-x-2">
                    <button
                      onclick={() => editDocument(doc)}
                      class="text-blue-600 hover:text-blue-800"
                      title="编辑文档"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onclick={() => deleteDocument(doc.id)}
                      class="text-red-600 hover:text-red-800"
                      title="删除文档"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}

            <!-- 加载更多按钮 -->
            {#if hasMore}
              <div class="text-center pt-4">
                <button
                  onclick={() => loadDocuments(selectedCollection, currentPage + 1)}
                  disabled={isLoading}
                  class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {#if isLoading}
                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  {:else}
                    加载更多
                  {/if}
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- 创建集合模态框 -->
    {#if showCreateCollection}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">创建新集合</h3>

            <div class="space-y-4">
              <div>
                <label for="collectionName" class="block text-sm font-medium text-gray-700 mb-2">
                  集合名称
                </label>
                <input
                  id="collectionName"
                  type="text"
                  bind:value={newCollectionName}
                  placeholder="输入集合名称"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label for="documentId" class="block text-sm font-medium text-gray-700 mb-2">
                  文档 ID（可选）
                </label>
                <input
                  id="documentId"
                  type="text"
                  bind:value={newDocumentId}
                  placeholder="留空自动生成"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label for="documentData" class="block text-sm font-medium text-gray-700 mb-2">
                  初始文档数据（JSON）
                </label>
                <textarea
                  id="documentData"
                  bind:value={newDocumentData}
                  rows="6"
                  placeholder="{`{\"name\": \"示例\", \"value\": 123}`}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button
                onclick={() => showCreateCollection = false}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onclick={createCollection}
                disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? '创建中...' : '创建集合'}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 创建文档模态框 -->
    {#if showCreateDocument}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">创建新文档</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  集合
                </label>
                <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700">
                  {selectedCollection}
                </div>
              </div>

              <div>
                <label for="newDocumentId" class="block text-sm font-medium text-gray-700 mb-2">
                  文档 ID（可选）
                </label>
                <input
                  id="newDocumentId"
                  type="text"
                  bind:value={newDocumentId}
                  placeholder="留空自动生成"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label for="newDocumentData" class="block text-sm font-medium text-gray-700 mb-2">
                  文档数据（JSON）
                </label>
                <textarea
                  id="newDocumentData"
                  bind:value={newDocumentData}
                  rows="8"
                  placeholder="{`{\"name\": \"示例\", \"value\": 123}`}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button
                onclick={() => showCreateDocument = false}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onclick={createDocument}
                disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? '创建中...' : '创建文档'}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 编辑文档模态框 -->
    {#if showEditDocument && selectedDocument}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              编辑文档: {selectedDocument.id}
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  集合
                </label>
                <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700">
                  {selectedCollection}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文档 ID
                </label>
                <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono">
                  {selectedDocument.id}
                </div>
              </div>

              <div>
                <label for="editDocumentData" class="block text-sm font-medium text-gray-700 mb-2">
                  文档数据（JSON）
                </label>
                <textarea
                  id="editDocumentData"
                  bind:value={editDocumentData}
                  rows="12"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button
                onclick={() => showEditDocument = false}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onclick={updateDocument}
                disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? '更新中...' : '更新文档'}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 功能说明 -->
    <div class="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
      <h3 class="text-lg font-medium text-blue-900 mb-4">Firestore 数据管理说明</h3>
      <div class="text-sm text-blue-800 space-y-2">
        <p>• <strong>安全架构</strong>：客户端通过服务器端 API 操作 Firestore，确保数据安全</p>
        <p>• <strong>集合管理</strong>：创建、查看和删除 Firestore 集合</p>
        <p>• <strong>文档操作</strong>：增删改查文档，支持 JSON 格式数据</p>
        <p>• <strong>实时同步</strong>：所有操作通过 Firebase Admin SDK 实时同步</p>
        <p>• <strong>批量操作</strong>：支持批量导入和批量操作（通过 API）</p>
      </div>
    </div>

    <!-- 返回首页链接 -->
    <div class="mt-8 text-center">
      <a
        href="/"
        class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回首页
      </a>
    </div>
  </div>
</div>
