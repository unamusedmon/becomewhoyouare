/**
 * The smallest WebDAV client that sync needs: GET and PUT of one file, with ETags so
 * two devices can't overwrite each other blindly. Works with Nextcloud, ownCloud,
 * Fastmail files, rclone serve webdav, Apache mod_dav and friends.
 *
 * Browsers block cross-origin requests unless the server sends CORS headers, and most
 * WebDAV servers don't. The local web server (scripts/serve-web.mjs) offers a
 * same-origin relay at /__dav; on the web it's used automatically when present.
 */
import { Platform } from 'react-native';

export interface DavConfig {
  /** The folder to sync into, e.g. https://cloud.example.com/remote.php/dav/files/zach/become/ */
  url: string;
  user: string;
  password: string;
}

export interface DavResult {
  status: number;
  text?: string;
  etag?: string;
}

export function fileUrl(cfg: DavConfig, name: string): string {
  return `${cfg.url.trim().replace(/\/*$/, '/')}${encodeURIComponent(name)}`;
}

function basicAuth(user: string, password: string): string {
  // btoa only takes Latin-1; passwords may not be.
  const bytes = encodeURIComponent(`${user}:${password}`).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return `Basic ${btoa(bytes)}`;
}

let relay: Promise<boolean> | undefined;
/** Is this page served by scripts/serve-web.mjs? Checked once. */
function hasRelay(): Promise<boolean> {
  if (Platform.OS !== 'web') return Promise.resolve(false);
  relay ??= fetch('/__dav/ping', { headers: { 'X-BWYA-Relay': '1' } }).then((r) => r.ok).catch(() => false);
  return relay;
}

async function request(cfg: DavConfig, method: 'GET' | 'PUT', name: string, init: { body?: string; headers?: Record<string, string> } = {}): Promise<DavResult> {
  const url = fileUrl(cfg, name);
  const headers: Record<string, string> = { Authorization: basicAuth(cfg.user, cfg.password), ...init.headers };
  const viaRelay = await hasRelay();
  const target = viaRelay ? `/__dav?url=${encodeURIComponent(url)}` : url;
  if (viaRelay) headers['X-BWYA-Relay'] = '1';
  const res = await fetch(target, { method, headers, body: init.body, cache: 'no-store' });
  const etag = res.headers.get('ETag') ?? undefined;
  const text = method === 'GET' && res.ok ? await res.text() : undefined;
  return { status: res.status, text, etag };
}

export function davGet(cfg: DavConfig, name: string): Promise<DavResult> {
  return request(cfg, 'GET', name);
}

/**
 * `ifMatch`: only overwrite the version we read. `undefined` with `create` set: only
 * write if the file doesn't exist yet. Either way a 412 means someone else wrote first.
 */
export function davPut(cfg: DavConfig, name: string, body: string, contentType: string, opts: { ifMatch?: string; create?: boolean } = {}): Promise<DavResult> {
  const headers: Record<string, string> = { 'Content-Type': contentType };
  if (opts.ifMatch) headers['If-Match'] = opts.ifMatch;
  else if (opts.create) headers['If-None-Match'] = '*';
  return request(cfg, 'PUT', name, { body, headers });
}
