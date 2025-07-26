/**
 * Firestore 相关类型定义
 */

export interface FirestoreDocument {
  id: string;
  data: Record<string, any>;
  createTime?: Date | string;
  updateTime?: Date | string;
  exists?: boolean;
}

export interface FirestoreCollection {
  id: string;
  name: string;
  documentCount?: number;
}

export interface FirestoreQueryCondition {
  field: string;
  operator: FirestoreOperator;
  value: any;
}

export type FirestoreOperator = 
  | '==' 
  | '!=' 
  | '<' 
  | '<=' 
  | '>' 
  | '>=' 
  | 'array-contains' 
  | 'array-contains-any' 
  | 'in' 
  | 'not-in';

export interface FirestoreOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FirestoreQueryOptions {
  collection: string;
  where?: FirestoreQueryCondition[];
  orderBy?: FirestoreOrderBy[];
  limit?: number;
  startAfter?: string;
  select?: string[];
}

export interface FirestoreBatchOperation {
  type: 'create' | 'set' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: Record<string, any>;
  merge?: boolean;
}

export interface FirestoreResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FirestoreDocumentListResponse {
  documents: FirestoreDocument[];
  count: number;
  hasMore: boolean;
  lastDocumentId: string | null;
}

export interface FirestoreCollectionListResponse {
  collections: string[];
  count: number;
}

export interface FirestoreBatchResponse {
  totalOperations: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    success: boolean;
    type?: string;
    collection?: string;
    documentId?: string;
    error?: string;
    operation?: FirestoreBatchOperation;
  }>;
  message: string;
}

export interface FirestoreImportResponse {
  collection: string;
  totalDocuments: number;
  importedCount: number;
  errorCount: number;
  errors: Array<{
    index: number;
    error: string;
    document: any;
  }>;
  message: string;
}

export interface FirestoreAggregateResponse {
  operation: string;
  collection: string;
  count?: number;
  totalDocuments?: number;
  averageSize?: number;
  oldestDocument?: number;
  newestDocument?: number;
}

/**
 * Firestore 错误类型
 */
export class FirestoreError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

/**
 * Firestore 验证错误
 */
export class FirestoreValidationError extends FirestoreError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'FirestoreValidationError';
  }
}

/**
 * Firestore 权限错误
 */
export class FirestorePermissionError extends FirestoreError {
  constructor(message: string = '权限不足') {
    super(message, 'PERMISSION_DENIED');
    this.name = 'FirestorePermissionError';
  }
}

/**
 * Firestore 网络错误
 */
export class FirestoreNetworkError extends FirestoreError {
  constructor(message: string = '网络连接失败') {
    super(message, 'NETWORK_ERROR');
    this.name = 'FirestoreNetworkError';
  }
}
