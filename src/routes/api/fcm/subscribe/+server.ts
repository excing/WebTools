import admin from 'firebase-admin';
import type { RequestHandler } from './$types';
import { initializeFirebaseAdmin } from '$lib/firebase-admin';

// 确保 admin SDK 已经初始化
// 例如，在你的 `src/lib/firebaseAdmin.ts` 或其他合适的初始化文件中
// import { initializeFirebaseAdmin } from '$lib/firebaseAdmin';
// initializeFirebaseAdmin(); 

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return new Response(JSON.stringify({ error: '缺少 token 或 topic' }), { status: 400 });
    }

    initializeFirebaseAdmin();

    // 使用 Firebase Admin SDK 订阅主题
    const response = await admin.messaging().subscribeToTopic(token, topic);

    console.log(`Token ${token} 成功订阅主题 ${topic}:`, response);
    return new Response(JSON.stringify(response), { status: 200 });

  } catch (error: any) {
    console.error('通过 Admin SDK 订阅主题失败:', error);
    return new Response(JSON.stringify({ error: error.message || '订阅主题失败' }), { status: 500 });
  }
};

// 确保 admin SDK 已经初始化
// import { initializeFirebaseAdmin } from '$lib/firebaseAdmin';
// initializeFirebaseAdmin();

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return new Response(JSON.stringify({ error: '缺少 token 或 topic' }), { status: 400 });
    }

    initializeFirebaseAdmin();

    // 使用 Firebase Admin SDK 取消订阅主题
    const response = await admin.messaging().unsubscribeFromTopic(token, topic);

    console.log(`Token ${token} 成功取消订阅主题 ${topic}:`, response);
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error('通过 Admin SDK 取消订阅主题失败:', error);
    return new Response(JSON.stringify({ error: error.message || '取消订阅主题失败' }), { status: 500 });
  }
};
