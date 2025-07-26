/**
 * Firestore 客户端工具库
 * 通过服务器端 API 安全操作 Firestore
 */

export interface FirestoreResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FirestoreDocument {
  id: string;
  data: any;
  createTime?: Date;
  updateTime?: Date;
}

export interface FirestoreCollection {
  name: string;
  documentCount?: number;
}

export interface QueryCondition {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: any;
}

export interface OrderByCondition {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  collection: string;
  where?: QueryCondition[];
  orderBy?: OrderByCondition[];
  limit?: number;
  startAfter?: string;
  select?: string[];
}

export interface BatchOperation {
  type: 'create' | 'set' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: any;
  merge?: boolean;
}

/**
 * Firestore 客户端类
 */
export class FirestoreClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/firestore') {
    this.baseUrl = baseUrl;
  }

  /**
   * 发送 HTTP 请求
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<FirestoreResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '网络请求失败'
      };
    }
  }

  /**
   * 获取所有集合
   */
  async getCollections(): Promise<FirestoreResponse<{ collections: string[]; count: number }>> {
    return this.request('/collections');
  }

  /**
   * 创建集合（通过添加第一个文档）
   */
  async createCollection(
    collectionName: string, 
    documentData: any, 
    documentId?: string
  ): Promise<FirestoreResponse<{ collectionName: string; documentId: string; message: string }>> {
    return this.request('/collections', {
      method: 'POST',
      body: JSON.stringify({
        collectionName,
        documentData,
        documentId
      })
    });
  }

  /**
   * 删除集合
   */
  async deleteCollection(
    collectionName: string, 
    batchSize: number = 100
  ): Promise<FirestoreResponse<{ collectionName: string; deletedCount: number; message: string }>> {
    return this.request('/collections', {
      method: 'DELETE',
      body: JSON.stringify({
        collectionName,
        batchSize
      })
    });
  }

  /**
   * 获取文档列表
   */
  async getDocuments(
    collection: string,
    options: {
      limit?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
      startAfter?: string;
    } = {}
  ): Promise<FirestoreResponse<{
    documents: FirestoreDocument[];
    count: number;
    hasMore: boolean;
    lastDocumentId: string | null;
  }>> {
    const params = new URLSearchParams({
      collection,
      limit: (options.limit || 10).toString(),
      orderBy: options.orderBy || 'createdAt',
      orderDirection: options.orderDirection || 'desc'
    });

    if (options.startAfter) {
      params.append('startAfter', options.startAfter);
    }

    return this.request(`/documents?${params}`);
  }

  /**
   * 获取单个文档
   */
  async getDocument(
    collection: string, 
    documentId: string
  ): Promise<FirestoreResponse<FirestoreDocument>> {
    const params = new URLSearchParams({
      collection,
      document: documentId
    });

    return this.request(`/documents?${params}`);
  }

  /**
   * 创建文档
   */
  async createDocument(
    collection: string,
    data: any,
    documentId?: string
  ): Promise<FirestoreResponse<{ collection: string; documentId: string; isNew: boolean; message: string }>> {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify({
        collection,
        documentId,
        data,
        merge: false
      })
    });
  }

  /**
   * 更新文档
   */
  async updateDocument(
    collection: string,
    documentId: string,
    data: any,
    merge: boolean = true
  ): Promise<FirestoreResponse<{ collection: string; documentId: string; message: string }>> {
    return this.request('/documents', {
      method: 'PUT',
      body: JSON.stringify({
        collection,
        documentId,
        data,
        merge
      })
    });
  }

  /**
   * 删除文档
   */
  async deleteDocument(
    collection: string,
    documentId: string
  ): Promise<FirestoreResponse<{ collection: string; documentId: string; message: string }>> {
    return this.request('/documents', {
      method: 'DELETE',
      body: JSON.stringify({
        collection,
        documentId
      })
    });
  }

  /**
   * 复杂查询
   */
  async query(options: QueryOptions): Promise<FirestoreResponse<{
    documents: FirestoreDocument[];
    count: number;
    hasMore: boolean;
    lastDocumentId: string | null;
    query: QueryOptions;
  }>> {
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  /**
   * 聚合查询
   */
  async aggregate(
    collection: string,
    operation: 'count' | 'stats' = 'count'
  ): Promise<FirestoreResponse<any>> {
    const params = new URLSearchParams({
      type: 'aggregate',
      collection,
      operation
    });

    return this.request(`/query?${params}`);
  }

  /**
   * 批量操作
   */
  async batchOperations(
    operations: BatchOperation[]
  ): Promise<FirestoreResponse<{
    totalOperations: number;
    successCount: number;
    failureCount: number;
    results: any[];
    message: string;
  }>> {
    return this.request('/batch', {
      method: 'POST',
      body: JSON.stringify({ operations })
    });
  }

  /**
   * 批量导入
   */
  async batchImport(
    collection: string,
    documents: Array<{ id?: string; data: any }>,
    batchSize: number = 100
  ): Promise<FirestoreResponse<{
    collection: string;
    totalDocuments: number;
    importedCount: number;
    errorCount: number;
    errors: any[];
    message: string;
  }>> {
    return this.request('/batch', {
      method: 'PUT',
      body: JSON.stringify({
        collection,
        documents,
        batchSize
      })
    });
  }
}

/**
 * 创建 Firestore 客户端实例
 */
export function createFirestoreClient(baseUrl?: string): FirestoreClient {
  return new FirestoreClient(baseUrl);
}

/**
 * 默认的 Firestore 客户端实例
 */
export const firestoreClient = createFirestoreClient();

/**
 * 工具函数：验证 JSON 字符串
 */
export function validateJSON(jsonString: string): { valid: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    return { valid: true, data };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * 工具函数：格式化 JSON
 */
export function formatJSON(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return String(obj);
  }
}

/**
 * 工具函数：生成随机文档 ID
 */
export function generateDocumentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
