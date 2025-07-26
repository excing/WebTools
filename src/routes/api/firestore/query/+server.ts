import type { RequestHandler } from '@sveltejs/kit';
import { initializeFirebaseAdmin } from '$lib/firebase-admin';
import admin from 'firebase-admin';
import { proxy } from '$lib/utils/proxy';

// 初始化 Firebase Admin
initializeFirebaseAdmin();

/**
 * 复杂查询 API
 * POST /api/firestore/query
 */
export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const queryConfig = await request.json();
    const {
      collection,
      where = [],
      orderBy = [],
      limit = 10,
      startAfter,
      select = []
    } = queryConfig;

    if (!collection) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少集合名称'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 在开发环境中使用代理请求
    const proxyResp = await proxy.json.post(url.pathname + url.search, {
      body: JSON.stringify(queryConfig)
    });
    if (proxyResp) return proxyResp;

    const db = admin.firestore();
    let query: admin.firestore.Query = db.collection(collection);

    // 添加 where 条件
    for (const condition of where) {
      const { field, operator, value } = condition;
      if (field && operator && value !== undefined) {
        query = query.where(field, operator as any, value);
      }
    }

    // 添加排序
    for (const order of orderBy) {
      const { field, direction = 'asc' } = order;
      if (field) {
        query = query.orderBy(field, direction as any);
      }
    }

    // 添加限制
    if (limit > 0) {
      query = query.limit(limit);
    }

    // 分页支持
    if (startAfter) {
      const startAfterDoc = await db.collection(collection).doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    // 字段选择
    if (select.length > 0) {
      query = query.select(...select);
    }

    const snapshot = await query.get();
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
      createTime: doc.createTime?.toDate(),
      updateTime: doc.updateTime?.toDate()
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        documents,
        count: documents.length,
        hasMore: documents.length === limit,
        lastDocumentId: documents.length > 0 ? documents[documents.length - 1].id : null,
        query: {
          collection,
          where,
          orderBy,
          limit,
          select
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('查询失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '查询失败'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

/**
 * 聚合查询 API
 * GET /api/firestore/query?type=aggregate&collection=xxx&operation=count
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get('type');
    const collection = url.searchParams.get('collection');
    const operation = url.searchParams.get('operation') || 'count';

    if (type !== 'aggregate' || !collection) {
      return new Response(JSON.stringify({
        success: false,
        error: '无效的查询类型或缺少集合名称'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 在开发环境中使用代理请求
    const proxyResp = await proxy.json.get(url.pathname + url.search);
    if (proxyResp) return proxyResp;

    const db = admin.firestore();
    const collectionRef = db.collection(collection);

    let result: any = {};

    switch (operation) {
      case 'count':
        const countSnapshot = await collectionRef.count().get();
        result = {
          operation: 'count',
          collection,
          count: countSnapshot.data().count
        };
        break;

      case 'stats':
        // 获取集合统计信息
        const snapshot = await collectionRef.get();
        const docs = snapshot.docs;

        result = {
          operation: 'stats',
          collection,
          totalDocuments: docs.length,
          averageSize: docs.length > 0 ? docs.reduce((sum, doc) => sum + JSON.stringify(doc.data()).length, 0) / docs.length : 0,
          oldestDocument: docs.length > 0 ? Math.min(...docs.map(doc => doc.createTime?.toMillis() || 0)) : null,
          newestDocument: docs.length > 0 ? Math.max(...docs.map(doc => doc.createTime?.toMillis() || 0)) : null
        };
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: '不支持的聚合操作'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('聚合查询失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '聚合查询失败'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
