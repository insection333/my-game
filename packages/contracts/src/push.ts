// Notices while away (session 171): a player switches them on in a browser, which hands the server where
// to send them (its push service's endpoint and keys) and the time zone it is in, so none comes at night.
// The server only ever sends to the browsers' own push services: an endpoint elsewhere is refused, so a
// page cannot have the server send requests where it pleases.
import { z } from 'zod';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

/** The push services of the browsers (Chrome and Edge, Firefox, Safari, Windows), by the end of their
 *  host name. */
export const PUSH_HOSTS: readonly string[] = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
];

/** Whether an endpoint is on a browser's push service, over https. */
export function pushEndpointAllowed(endpoint: string, hosts: readonly string[] = PUSH_HOSTS): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

const Key = z
  .string()
  .min(8)
  .max(256)
  .regex(/^[A-Za-z0-9_=-]+$/);
/** An IANA time zone's name ("Australia/Sydney", "UTC"). */
export const TimeZone = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+){0,2}$/);

export const PushOn = z
  .object({
    endpoint: z.string().min(12).max(1000),
    keys: z.object({ p256dh: Key, auth: Key }).strict(),
    tz: TimeZone,
  })
  .strict();
export const PushOff = z.object({ endpoint: z.string().min(1).max(1000) }).strict();

export interface PushKeyResponse {
  /** The server's public key, for the browser's subscription (applicationServerKey). */
  key: string;
}

const route = (r: RouteContract) => r;

export const PUSH_ROUTES = {
  pushKey: route({ id: 'pushKey', method: 'GET', path: PATHS.pushKey, auth: 'player', input: null, example: null }),
  pushOn: route({
    id: 'pushOn',
    method: 'POST',
    path: PATHS.pushOn,
    auth: 'player',
    input: PushOn,
    example: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/example-subscription',
      keys: { p256dh: 'BExampleKeyOfTheBrowser0123456789', auth: 'exampleAuth0123' },
      tz: 'Australia/Sydney',
    },
  }),
  pushOff: route({
    id: 'pushOff',
    method: 'POST',
    path: PATHS.pushOff,
    auth: 'player',
    input: PushOff,
    example: { endpoint: 'https://fcm.googleapis.com/fcm/send/example-subscription' },
  }),
} as const;
