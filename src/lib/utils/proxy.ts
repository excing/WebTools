import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";

function headers(contentType: string, init?: RequestInit) {
    let headers = init?.headers || {};
    headers = { ...headers, "Content-Type": contentType }
    return headers;
}

export async function proxyRequest(input: string | URL | globalThis.Request, init?: RequestInit) {
    if (dev && env.DOMAIN) {
        const resp = await fetch(`${env.DOMAIN}${input}`, init);
        const headers = new Headers(resp.headers);
        headers.delete('content-encoding');
        headers.delete('content-length');
        return new Response(resp.body, {
            status: resp.status,
            headers: headers,
        });
    }

    return null;
}

export const proxy = {
    json: {
        get: (input: string | URL | globalThis.Request, init?: RequestInit) => {
            return proxyRequest(input, { ...init, method: "GET", headers: headers("application/json", init) })
        },

        put: (input: string | URL | globalThis.Request, init?: RequestInit) => {
            return proxyRequest(input, { ...init, method: "PUT", headers: headers("application/json", init) })
        },

        post: (input: string | URL | globalThis.Request, init?: RequestInit) => {
            return proxyRequest(input, { ...init, method: "POST", headers: headers("application/json", init) })
        },

        delete: (input: string | URL | globalThis.Request, init?: RequestInit) => {
            return proxyRequest(input, { ...init, method: "DELETE", headers: headers("application/json", init) })
        }
    }
}