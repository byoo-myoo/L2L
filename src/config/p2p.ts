import type { PeerOptions } from 'peerjs';

const host = (import.meta.env.VITE_PEERJS_HOST as string | undefined) || undefined;
const port = import.meta.env.VITE_PEERJS_PORT ? Number(import.meta.env.VITE_PEERJS_PORT) : undefined;
const secureRaw = import.meta.env.VITE_PEERJS_SECURE as string | undefined;
const secure = secureRaw !== undefined ? secureRaw === 'true' || secureRaw === '1' : undefined;

const rawPath = import.meta.env.VITE_PEERJS_PATH as string | undefined;
const normalizePath = (p?: string): string | undefined => {
    if (!p) return undefined;
    if (p.endsWith('/peerjs')) return p.replace(/\/peerjs$/, '/') || '/';
    return p;
};
const path = normalizePath(rawPath);

const turnUrls = (import.meta.env.VITE_TURN_URL as string | undefined)
    ? import.meta.env.VITE_TURN_URL.split(',').map((u: string) => u.trim()).filter(Boolean)
    : [];
const turnUsername = (import.meta.env.VITE_TURN_USERNAME as string | undefined) || undefined;
const turnCredential = (import.meta.env.VITE_TURN_PASSWORD as string | undefined) || undefined;

const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(turnUrls.length
        ? [
              {
                  urls: turnUrls,
                  username: turnUsername,
                  credential: turnCredential,
              },
          ]
        : []),
];

export function getPeerOptions(): PeerOptions | undefined {
    const opts: PeerOptions = {};
    if (host) opts.host = host;
    if (port) opts.port = port;
    if (secure !== undefined) opts.secure = secure;
    if (path) opts.path = path;
    if (iceServers.length) opts.config = { iceServers };
    return Object.keys(opts).length ? opts : undefined;
}
