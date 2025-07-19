import { dev } from "$app/environment";
import { env } from "$env/dynamic/public";

export function apiUrl(url: string) {
    return dev ? `${env.PUBLIC_DOMAIN}${url}` : url;
}