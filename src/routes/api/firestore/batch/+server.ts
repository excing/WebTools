import type { RequestHandler } from '@sveltejs/kit';
import { initializeFirebaseAdmin } from '$lib/firebase-admin';
import admin from 'firebase-admin';

// 初始化 Firebase Admin
initializeFirebaseAdmin();

/**
 * 批量操作 API
 * POST /api/firestore/batch
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { operations } = await request.json();

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少操作列表或操作列表为空'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (operations.length > 500) {
      return new Response(JSON.stringify({
        success: false,
        error: '批量操作数量不能超过 500 个'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 在开发环境中直接处理请求

    const db = admin.firestore();
    const batch = db.batch();
    const results: any[] = [];

    for (const operation of operations) {
      const { type, collection, documentId, data, merge } = operation;

      if (!type || !collection) {
        results.push({
          success: false,
          error: '缺少操作类型或集合名称',
          operation
        });
        continue;
      }

      try {
        const collectionRef = db.collection(collection);

        switch (type) {
          case 'create':
          case 'set':
            if (!data) {
              results.push({
                success: false,
                error: '缺少文档数据',
                operation
              });
              continue;
            }

            const dataWithTimestamp = {
              ...data,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (type === 'create' || !documentId) {
              dataWithTimestamp.createdAt = admin.firestore.FieldValue.serverTimestamp();
            }

            if (documentId) {
              const docRef = collectionRef.doc(documentId);
              if (merge) {
                batch.set(docRef, dataWithTimestamp, { merge: true });
              } else {
                batch.set(docRef, dataWithTimestamp);
              }
              results.push({
                success: true,
                type,
                collection,
                documentId,
                operation
              });
            } else {
              // 对于批量操作，无法使用 add() 方法，需要生成 ID
              const newDocRef = collectionRef.doc();
              batch.set(newDocRef, dataWithTimestamp);
              results.push({
                success: true,
                type,
                collection,
                documentId: newDocRef.id,
                operation
              });
            }
            break;

          case 'update':
            if (!documentId || !data) {
              results.push({
                success: false,
                error: '缺少文档ID或更新数据',
                operation
              });
              continue;
            }

            const updateData = {
              ...data,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            const updateDocRef = collectionRef.doc(documentId);
            batch.update(updateDocRef, updateData);
            results.push({
              success: true,
              type,
              collection,
              documentId,
              operation
            });
            break;

          case 'delete':
            if (!documentId) {
              results.push({
                success: false,
                error: '缺少文档ID',
                operation
              });
              continue;
            }

            const deleteDocRef = collectionRef.doc(documentId);
            batch.delete(deleteDocRef);
            results.push({
              success: true,
              type,
              collection,
              documentId,
              operation
            });
            break;

          default:
            results.push({
              success: false,
              error: `不支持的操作类型: ${type}`,
              operation
            });
        }
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message || '操作失败',
          operation
        });
      }
    }

    // 执行批量操作
    await batch.commit();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalOperations: operations.length,
        successCount,
        failureCount,
        results,
        message: `批量操作完成：成功 ${successCount} 个，失败 ${failureCount} 个`
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('批量操作失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '批量操作失败'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

/**
 * 批量导入 API
 * PUT /api/firestore/batch
 */
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const { collection, documents, batchSize = 100 } = await request.json();

    if (!collection || !documents || !Array.isArray(documents)) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少集合名称或文档数组'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 在开发环境中直接处理请求

    const db = admin.firestore();
    const collectionRef = db.collection(collection);
    
    let totalImported = 0;
    const errors: any[] = [];

    // 分批处理
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = db.batch();
      const batchDocuments = documents.slice(i, i + batchSize);

      for (const doc of batchDocuments) {
        try {
          const { id, data } = doc;
          
          if (!data) {
            errors.push({
              index: i + batchDocuments.indexOf(doc),
              error: '缺少文档数据',
              document: doc
            });
            continue;
          }

          const dataWithTimestamp = {
            ...data,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          const docRef = id ? collectionRef.doc(id) : collectionRef.doc();
          batch.set(docRef, dataWithTimestamp);
          totalImported++;
        } catch (error: any) {
          errors.push({
            index: i + batchDocuments.indexOf(doc),
            error: error.message || '处理文档失败',
            document: doc
          });
        }
      }

      // 提交当前批次
      await batch.commit();
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        collection,
        totalDocuments: documents.length,
        importedCount: totalImported,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // 只返回前10个错误
        message: `批量导入完成：成功导入 ${totalImported} 个文档，失败 ${errors.length} 个`
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('批量导入失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '批量导入失败'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
