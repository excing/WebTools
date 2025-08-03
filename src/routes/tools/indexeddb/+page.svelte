<script lang="ts">
	import { onMount } from "svelte";
	import { browser } from "$app/environment";

	interface Database {
		name: string;
		version: number;
		objectStores: string[];
	}

	interface DataRecord {
		[key: string]: any;
	}

	let databases: Database[] = [];
	let selectedDb: string = "";
	let selectedStore: string = "";
	let currentData: DataRecord[] = [];
	let currentPage = 1;
	let pageSize = 10;
	let totalRecords = 0;

	// Form states
	let showCreateDb = false;
	let showCreateStore = false;
	let showAddData = false;
	let editingRecord: DataRecord | null = null;

	// Form data
	let newDbName = "";
	let newDbVersion = 1;
	let newStoreName = "";
	let newStoreKeyPath = "id";
	let newStoreAutoIncrement = true;
	let newDataJson =
		'{\n  "id": 1,\n  "name": "示例数据",\n  "type": "test",\n  "timestamp": "' +
		new Date().toISOString() +
		'"\n}';

	let searchQuery = "";
	let sortField = "";
	let sortDirection: "asc" | "desc" = "asc";

	onMount(() => {
		if (browser) {
			loadDatabases();
		}
	});

	async function loadDatabases() {
		try {
			if ("indexedDB" in window) {
				databases = JSON.parse(
					localStorage.getItem("indexeddb-databases") || "[]",
				);
			}
		} catch (error) {
			console.error("加载数据库失败:", error);
		}
	}

	async function createDatabase() {
		if (!newDbName.trim()) return;

		try {
			const request = indexedDB.open(newDbName, newDbVersion);

			request.onsuccess = () => {
				const db = request.result;
				const dbInfo: Database = {
					name: newDbName,
					version: newDbVersion,
					objectStores: Array.from(db.objectStoreNames),
				};

				databases = [...databases, dbInfo];
				saveDatabasesList();
				db.close();

				newDbName = "";
				newDbVersion = 1;
				showCreateDb = false;
			};

			request.onerror = () => {
				alert("创建数据库失败: " + request.error);
			};
		} catch (error) {
			console.error("创建数据库错误:", error);
		}
	}

	async function createObjectStore() {
		if (!selectedDb || !newStoreName.trim()) return;

		try {
			const currentDb = databases.find((db) => db.name === selectedDb);
			if (!currentDb) return;

			const newVersion = currentDb.version + 1;
			const request = indexedDB.open(selectedDb, newVersion);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(newStoreName)) {
					const store = db.createObjectStore(newStoreName, {
						keyPath: newStoreKeyPath,
						autoIncrement: newStoreAutoIncrement,
					});

					store.createIndex("timestamp", "timestamp", {
						unique: false,
					});
				}
			};

			request.onsuccess = () => {
				const db = request.result;
				currentDb.version = newVersion;
				currentDb.objectStores = Array.from(db.objectStoreNames);
				saveDatabasesList();
				db.close();

				loadDatabases();

				newStoreName = "";
				newStoreKeyPath = "id";
				newStoreAutoIncrement = true;
				showCreateStore = false;
				loadObjectStoreData();
			};

			request.onerror = () => {
				alert("创建对象存储失败: " + request.error);
			};
		} catch (error) {
			console.error("创建对象存储错误:", error);
		}
	}

	async function loadObjectStoreData() {
		if (!selectedDb || !selectedStore) {
			currentData = [];
			totalRecords = 0;
			return;
		}

		try {
			const request = indexedDB.open(selectedDb);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction([selectedStore], "readonly");
				const store = transaction.objectStore(selectedStore);
				const getAllRequest = store.getAll();

				getAllRequest.onsuccess = () => {
					let allData = getAllRequest.result;

					if (searchQuery.trim()) {
						allData = allData.filter((item) =>
							JSON.stringify(item)
								.toLowerCase()
								.includes(searchQuery.toLowerCase()),
						);
					}

					if (sortField) {
						allData.sort((a, b) => {
							const aVal = a[sortField];
							const bVal = b[sortField];
							const comparison =
								aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
							return sortDirection === "asc"
								? comparison
								: -comparison;
						});
					}

					totalRecords = allData.length;

					const startIndex = (currentPage - 1) * pageSize;
					const endIndex = startIndex + pageSize;
					currentData = allData.slice(startIndex, endIndex);
				};

				transaction.oncomplete = () => {
					db.close();
				};
			};
		} catch (error) {
			console.error("加载数据失败:", error);
		}
	}

	async function addData() {
		if (!selectedDb || !selectedStore || !newDataJson.trim()) return;

		try {
			const data = JSON.parse(newDataJson);
			const request = indexedDB.open(selectedDb);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction(
					[selectedStore],
					"readwrite",
				);
				const store = transaction.objectStore(selectedStore);

				if (!data.timestamp) {
					data.timestamp = new Date().toISOString();
				}

				const addRequest = store.add(data);

				addRequest.onsuccess = () => {
					loadObjectStoreData();
					newDataJson =
						'{\n  "id": ' +
						Date.now() +
						',\n  "name": "新数据",\n  "timestamp": "' +
						new Date().toISOString() +
						'"\n}';
					showAddData = false;
				};

				addRequest.onerror = () => {
					alert("添加数据失败: " + addRequest.error);
				};

				transaction.oncomplete = () => {
					db.close();
				};
			};
		} catch (error) {
			alert(
				"JSON 格式错误: " +
					(error instanceof Error ? error.message : String(error)),
			);
		}
	}

	async function updateRecord(record: DataRecord) {
		if (!selectedDb || !selectedStore) return;

		try {
			const request = indexedDB.open(selectedDb);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction(
					[selectedStore],
					"readwrite",
				);
				const store = transaction.objectStore(selectedStore);

				record.timestamp = new Date().toISOString();
				const updateRequest = store.put(record);

				updateRequest.onsuccess = () => {
					loadObjectStoreData();
					editingRecord = null;
				};

				transaction.oncomplete = () => {
					db.close();
				};
			};
		} catch (error) {
			console.error("更新数据失败:", error);
		}
	}

	async function deleteRecord(key: any) {
		if (!selectedDb || !selectedStore || !confirm("确定要删除这条记录吗？"))
			return;

		try {
			const request = indexedDB.open(selectedDb);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction(
					[selectedStore],
					"readwrite",
				);
				const store = transaction.objectStore(selectedStore);

				const deleteRequest = store.delete(key);

				deleteRequest.onsuccess = () => {
					loadObjectStoreData();
				};

				transaction.oncomplete = () => {
					db.close();
				};
			};
		} catch (error) {
			console.error("删除数据失败:", error);
		}
	}

	async function deleteDatabase(dbName: string) {
		if (!confirm(`确定要删除数据库 "${dbName}" 吗？这将删除所有数据！`))
			return;

		try {
			const deleteRequest = indexedDB.deleteDatabase(dbName);

			deleteRequest.onsuccess = () => {
				databases = databases.filter((db) => db.name !== dbName);
				saveDatabasesList();
				if (selectedDb === dbName) {
					selectedDb = "";
					selectedStore = "";
					currentData = [];
				}
			};

			deleteRequest.onerror = () => {
				alert("删除数据库失败: " + deleteRequest.error);
			};
		} catch (error) {
			console.error("删除数据库错误:", error);
		}
	}

	function saveDatabasesList() {
		localStorage.setItem("indexeddb-databases", JSON.stringify(databases));
	}

	function handleDbChange() {
		selectedStore = "";
		currentData = [];
		currentPage = 1;
	}

	function handleStoreChange() {
		currentPage = 1;
		loadObjectStoreData();
	}

	function handleSearch() {
		currentPage = 1;
		loadObjectStoreData();
	}

	function handleSort(field: string) {
		if (sortField === field) {
			sortDirection = sortDirection === "asc" ? "desc" : "asc";
		} else {
			sortField = field;
			sortDirection = "asc";
		}
		loadObjectStoreData();
	}

	function changePage(page: number) {
		currentPage = page;
		loadObjectStoreData();
	}

	function getTotalPages() {
		return Math.ceil(totalRecords / pageSize);
	}

	function formatValue(value: any): string {
		if (typeof value === "object" && value !== null) {
			return JSON.stringify(value, null, 2);
		}
		return String(value);
	}

	function getObjectKeys(obj: any): string[] {
		if (!obj || typeof obj !== "object") return [];
		return Object.keys(obj);
	}
</script>

<svelte:head>
	<title>IndexedDB 测试工具 - WebTools</title>
	<meta
		name="description"
		content="功能完整的 IndexedDB 测试工具，支持数据库和表的创建、数据的增删改查、分页和搜索功能。"
	/>
	<meta
		name="keywords"
		content="IndexedDB, 数据库测试, 前端存储, Web API, 数据管理"
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- 页面标题 -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-4">
				IndexedDB 测试工具
			</h1>
			<p class="text-lg text-gray-600 max-w-3xl mx-auto">
				功能完整的 IndexedDB
				测试工具，支持数据库和对象存储的创建、数据的增删改查、分页和搜索功能。
			</p>
		</div>

		<!-- 数据库管理区域 -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-8">
			<div
				class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"
			>
				<h2 class="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">
					数据库管理
				</h2>
				<button
					on:click={() => (showCreateDb = true)}
					class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
				>
					创建数据库
				</button>
			</div>

			<!-- 数据库列表 -->
			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
			>
				{#each databases as db}
					<div
						class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
					>
						<div class="flex justify-between items-start mb-2">
							<h3 class="font-semibold text-gray-900">
								{db.name}
							</h3>
							<button
								on:click={() => deleteDatabase(db.name)}
								class="text-red-600 hover:text-red-800 text-sm"
								title="删除数据库"
							>
								删除
							</button>
						</div>
						<p class="text-sm text-gray-600 mb-2">
							版本: {db.version}
						</p>
						<p class="text-sm text-gray-600 mb-3">
							对象存储: {db.objectStores.length} 个
						</p>
						<button
							on:click={() => {
								selectedDb = db.name;
								handleDbChange();
							}}
							class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm transition-colors"
							class:bg-blue-100={selectedDb === db.name}
							class:text-blue-800={selectedDb === db.name}
						>
							{selectedDb === db.name ? "已选择" : "选择"}
						</button>
					</div>
				{/each}
			</div>

			{#if databases.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p>暂无数据库，点击"创建数据库"开始使用</p>
				</div>
			{/if}

			<!-- 对象存储管理区域 -->
			{#if selectedDb}
				<div class="bg-white rounded-lg shadow-md p-6 mb-8">
					<div
						class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"
					>
						<h2
							class="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0"
						>
							对象存储管理 - {selectedDb}
						</h2>
						<button
							on:click={() => (showCreateStore = true)}
							class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
						>
							创建对象存储
						</button>
					</div>

					<!-- 对象存储选择 -->
					<div class="mb-6">
						<label
							for="store-select"
							class="block text-sm font-medium text-gray-700 mb-2"
						>
							选择对象存储:
						</label>
						<select
							id="store-select"
							bind:value={selectedStore}
							on:change={handleStoreChange}
							class="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">请选择对象存储</option>
							{#each databases.find((db) => db.name === selectedDb)?.objectStores || [] as store}
								<option value={store}>{store}</option>
							{/each}
						</select>
					</div>
				</div>
			{/if}

			<!-- 数据管理区域 -->
			{#if selectedDb && selectedStore}
				<div class="bg-white rounded-lg shadow-md p-6 mb-8">
					<div
						class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"
					>
						<h2
							class="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0"
						>
							数据管理 - {selectedStore}
						</h2>
						<button
							on:click={() => (showAddData = true)}
							class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
						>
							添加数据
						</button>
					</div>

					<!-- 搜索和排序 -->
					<div class="flex flex-col sm:flex-row gap-4 mb-6">
						<div class="flex-1">
							<input
								type="text"
								placeholder="搜索数据..."
								bind:value={searchQuery}
								on:input={handleSearch}
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div class="flex gap-2">
							<select
								bind:value={pageSize}
								on:change={() => {
									currentPage = 1;
									loadObjectStoreData();
								}}
								class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value={5}>5条/页</option>
								<option value={10}>10条/页</option>
								<option value={20}>20条/页</option>
								<option value={50}>50条/页</option>
							</select>
						</div>
					</div>

					<!-- 数据表格 -->
					{#if currentData.length > 0}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										{#each getObjectKeys(currentData[0]) as key}
											<th
												class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
												on:click={() => handleSort(key)}
											>
												<div class="flex items-center">
													{key}
													{#if sortField === key}
														<span class="ml-1">
															{sortDirection ===
															"asc"
																? "↑"
																: "↓"}
														</span>
													{/if}
												</div>
											</th>
										{/each}
										<th
											class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											操作
										</th>
									</tr>
								</thead>
								<tbody
									class="bg-white divide-y divide-gray-200"
								>
									{#each currentData as record}
										<tr class="hover:bg-gray-50">
											{#each getObjectKeys(record) as key}
												<td
													class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
												>
													{#if editingRecord === record}
														<input
															type="text"
															bind:value={
																record[key]
															}
															class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
														/>
													{:else}
														<div
															class="max-w-xs truncate"
															title={formatValue(
																record[key],
															)}
														>
															{formatValue(
																record[key],
															)}
														</div>
													{/if}
												</td>
											{/each}
											<td
												class="px-6 py-4 whitespace-nowrap text-sm font-medium"
											>
												{#if editingRecord === record}
													<button
														on:click={() =>
															updateRecord(
																record,
															)}
														class="text-green-600 hover:text-green-900 mr-3"
													>
														保存
													</button>
													<button
														on:click={() =>
															(editingRecord =
																null)}
														class="text-gray-600 hover:text-gray-900"
													>
														取消
													</button>
												{:else}
													<button
														on:click={() =>
															(editingRecord =
																record)}
														class="text-blue-600 hover:text-blue-900 mr-3"
													>
														编辑
													</button>
													<button
														on:click={() =>
															deleteRecord(
																record[
																	getObjectKeys(
																		record,
																	)[0]
																],
															)}
														class="text-red-600 hover:text-red-900"
													>
														删除
													</button>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<!-- 分页 -->
						{#if getTotalPages() > 1}
							<div class="flex items-center justify-between mt-6">
								<div class="text-sm text-gray-700">
									显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(
										currentPage * pageSize,
										totalRecords,
									)} 条，共 {totalRecords} 条
								</div>
								<div class="flex space-x-2">
									<button
										on:click={() =>
											changePage(currentPage - 1)}
										disabled={currentPage === 1}
										class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										上一页
									</button>

									{#each Array.from({ length: getTotalPages() }, (_, i) => i + 1) as page}
										{#if page === 1 || page === getTotalPages() || (page >= currentPage - 2 && page <= currentPage + 2)}
											<button
												on:click={() =>
													changePage(page)}
												class="px-3 py-2 border rounded-md text-sm font-medium transition-colors"
												class:bg-blue-600={currentPage ===
													page}
												class:text-white={currentPage ===
													page}
												class:border-blue-600={currentPage ===
													page}
												class:bg-white={currentPage !==
													page}
												class:text-gray-700={currentPage !==
													page}
												class:border-gray-300={currentPage !==
													page}
												class:hover:bg-gray-50={currentPage !==
													page}
											>
												{page}
											</button>
										{:else if page === currentPage - 3 || page === currentPage + 3}
											<span
												class="px-3 py-2 text-gray-500"
												>...</span
											>
										{/if}
									{/each}

									<button
										on:click={() =>
											changePage(currentPage + 1)}
										disabled={currentPage ===
											getTotalPages()}
										class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										下一页
									</button>
								</div>
							</div>
						{/if}
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p>暂无数据，点击"添加数据"开始添加</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- 使用说明 -->
			<div class="bg-white rounded-lg shadow-md p-6 mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">
					使用说明
				</h2>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div>
						<h3 class="text-lg font-semibold text-gray-800 mb-4">
							功能特性
						</h3>
						<ul class="space-y-2 text-gray-600">
							<li class="flex items-start">
								<span class="text-green-500 mr-2">✓</span>
								创建和管理多个 IndexedDB 数据库
							</li>
							<li class="flex items-start">
								<span class="text-green-500 mr-2">✓</span>
								创建和管理对象存储（表）
							</li>
							<li class="flex items-start">
								<span class="text-green-500 mr-2">✓</span>
								支持 JSON 格式的复杂数据结构
							</li>
							<li class="flex items-start">
								<span class="text-green-500 mr-2">✓</span>
								完整的增删改查操作
							</li>
							<li class="flex items-start">
								<span class="text-green-500 mr-2">✓</span>
								实时搜索和排序功能
							</li>
							<li class="flex items-start">
								<span class="text-green-500 mr-2">✓</span>
								分页显示，支持自定义每页条数
							</li>
							<li class="flex items-start">
								<span class="text-green-500 mr-2">✓</span>
								响应式设计，移动端友好
							</li>
						</ul>
					</div>

					<div>
						<h3 class="text-lg font-semibold text-gray-800 mb-4">
							使用步骤
						</h3>
						<ol class="space-y-2 text-gray-600">
							<li class="flex items-start">
								<span
									class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5"
									>1</span
								>
								点击"创建数据库"按钮创建新的 IndexedDB 数据库
							</li>
							<li class="flex items-start">
								<span
									class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5"
									>2</span
								>
								选择数据库后，点击"创建对象存储"创建数据表
							</li>
							<li class="flex items-start">
								<span
									class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5"
									>3</span
								>
								选择对象存储后，可以开始添加、编辑、删除数据
							</li>
							<li class="flex items-start">
								<span
									class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5"
									>4</span
								>
								使用搜索框快速查找数据，点击列标题进行排序
							</li>
							<li class="flex items-start">
								<span
									class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5"
									>5</span
								>
								使用分页功能浏览大量数据
							</li>
						</ol>
					</div>
				</div>
			</div>

			<!-- 技术原理 -->
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">
					技术原理与实现
				</h2>

				<div class="space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-gray-800 mb-3">
							IndexedDB 简介
						</h3>
						<p class="text-gray-600 leading-relaxed">
							IndexedDB
							是一个运行在浏览器中的非关系型数据库，它提供了比
							localStorage 更强大的数据存储能力。
							支持事务、索引、大容量存储，并且是异步的，不会阻塞主线程。
						</p>
					</div>

					<div>
						<h3 class="text-lg font-semibold text-gray-800 mb-3">
							核心概念
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="bg-gray-50 p-4 rounded-lg">
								<h4 class="font-semibold text-gray-800 mb-2">
									数据库 (Database)
								</h4>
								<p class="text-sm text-gray-600">
									包含多个对象存储的容器，每个数据库有唯一的名称和版本号。
								</p>
							</div>
							<div class="bg-gray-50 p-4 rounded-lg">
								<h4 class="font-semibold text-gray-800 mb-2">
									对象存储 (Object Store)
								</h4>
								<p class="text-sm text-gray-600">
									类似于关系数据库中的表，用于存储 JavaScript
									对象。
								</p>
							</div>
							<div class="bg-gray-50 p-4 rounded-lg">
								<h4 class="font-semibold text-gray-800 mb-2">
									事务 (Transaction)
								</h4>
								<p class="text-sm text-gray-600">
									确保数据操作的原子性，所有操作要么全部成功，要么全部失败。
								</p>
							</div>
							<div class="bg-gray-50 p-4 rounded-lg">
								<h4 class="font-semibold text-gray-800 mb-2">
									索引 (Index)
								</h4>
								<p class="text-sm text-gray-600">
									提供除主键外的其他查询方式，提高查询效率。
								</p>
							</div>
						</div>
					</div>

					<div>
						<h3 class="text-lg font-semibold text-gray-800 mb-3">
							实现技术
						</h3>
						<div class="bg-gray-50 p-4 rounded-lg">
							<ul class="space-y-2 text-gray-600">
								<li>
									<strong>前端框架:</strong> Svelte 5 + TypeScript
								</li>
								<li>
									<strong>样式框架:</strong> Tailwind CSS 4.0
								</li>
								<li>
									<strong>数据存储:</strong> IndexedDB API + localStorage
									(数据库列表)
								</li>
								<li>
									<strong>响应式设计:</strong> CSS Grid + Flexbox
								</li>
								<li>
									<strong>状态管理:</strong> Svelte 响应式变量
								</li>
							</ul>
						</div>
					</div>

					<div>
						<h3 class="text-lg font-semibold text-gray-800 mb-3">
							浏览器兼容性
						</h3>
						<p class="text-gray-600 leading-relaxed">
							IndexedDB 在现代浏览器中有良好的支持，包括 Chrome
							24+、Firefox 16+、Safari 10+、Edge 12+。
							本工具会自动检测浏览器支持情况。
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 创建数据库模态框 -->
	{#if showCreateDb}
		<div
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
		>
			<div class="bg-white rounded-lg max-w-md w-full p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					创建新数据库
				</h3>

				<div class="space-y-4">
					<div>
						<label
							for="db-name"
							class="block text-sm font-medium text-gray-700 mb-1"
						>
							数据库名称
						</label>
						<input
							id="db-name"
							type="text"
							bind:value={newDbName}
							placeholder="输入数据库名称"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label
							for="db-version"
							class="block text-sm font-medium text-gray-700 mb-1"
						>
							版本号
						</label>
						<input
							id="db-version"
							type="number"
							bind:value={newDbVersion}
							min="1"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showCreateDb = false)}
						class="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
					>
						取消
					</button>
					<button
						on:click={createDatabase}
						disabled={!newDbName.trim()}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						创建
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- 创建对象存储模态框 -->
	{#if showCreateStore}
		<div
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
		>
			<div class="bg-white rounded-lg max-w-md w-full p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					创建对象存储
				</h3>

				<div class="space-y-4">
					<div>
						<label
							for="store-name"
							class="block text-sm font-medium text-gray-700 mb-1"
						>
							对象存储名称
						</label>
						<input
							id="store-name"
							type="text"
							bind:value={newStoreName}
							placeholder="输入对象存储名称"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label
							for="store-keypath"
							class="block text-sm font-medium text-gray-700 mb-1"
						>
							主键字段
						</label>
						<input
							id="store-keypath"
							type="text"
							bind:value={newStoreKeyPath}
							placeholder="主键字段名称"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex items-center">
						<input
							id="store-autoincrement"
							type="checkbox"
							bind:checked={newStoreAutoIncrement}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label
							for="store-autoincrement"
							class="ml-2 block text-sm text-gray-700"
						>
							自动递增主键
						</label>
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showCreateStore = false)}
						class="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
					>
						取消
					</button>
					<button
						on:click={createObjectStore}
						disabled={!newStoreName.trim()}
						class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						创建
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- 添加数据模态框 -->
	{#if showAddData}
		<div
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
		>
			<div class="bg-white rounded-lg max-w-2xl w-full p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					添加新数据
				</h3>

				<div class="space-y-4">
					<div>
						<label
							for="data-json"
							class="block text-sm font-medium text-gray-700 mb-1"
						>
							JSON 数据 (支持复杂对象结构)
						</label>
						<textarea
							id="data-json"
							bind:value={newDataJson}
							rows="10"
							placeholder="输入 JSON 格式的数据"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
						></textarea>
						<p class="text-xs text-gray-500 mt-1">
							示例: {`{"id": 1, "name": "测试", "data": {"type": "object", "values": [1, 2, 3]}}`}
						</p>
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showAddData = false)}
						class="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
					>
						取消
					</button>
					<button
						on:click={addData}
						disabled={!newDataJson.trim()}
						class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						添加
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
