// 编写一个 sveltekit api, 接收消息

import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "@sveltejs/kit";
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  env.GOOGLE_FIREBASE_ADMIN_SERVICE_ACCOUNT
);

export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!admin.apps || !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount), // Your service account JSON
    });
  }

  const messaging = admin.messaging();
  const message = await request.json();

  try {
    // console.log("send message to firebase: ", message);

    if (dev && env.DOMAIN) {
      const resp = await fetch(`${env.DOMAIN}/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
      const headers = new Headers(resp.headers);
      headers.delete('content-encoding');
      headers.delete('content-length');
      return new Response(resp.body, {
        status: resp.status,
        headers: headers,
      });
    }

    const response = await messaging.send(message);
    return new Response(response, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
}