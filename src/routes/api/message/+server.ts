// 编写一个 sveltekit api, 接收消息

import { env } from "$env/dynamic/private";
import type { RequestHandler } from "@sveltejs/kit";
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  env.GOOGLE_FIREBASE_ADMIN_SERVICE_ACCOUNT
);

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { status: 204 });
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!admin.apps || !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount), // Your service account JSON
    });
  }

  const messaging = admin.messaging();
  const message = await request.json();

  try {
    console.log("send message to firebase: ", message);

    const response = await messaging.send(message);
    return new Response(response, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
}