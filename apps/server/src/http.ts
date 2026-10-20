// The HTTP layer every route shares: strict JSON only, security headers, the origin check, error
// answers by code, and `contractRoute`, which mounts a route from its contract so its input is
// checked by the same schema the page and the hostile-input suite use.
import type { ErrorCode, ErrorResponse, RouteContract } from '@idle-clash/contracts';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { BadJson, SECURITY_HEADERS, strictJson } from './security.ts';

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly extra: Omit<ErrorResponse['error'], 'code'>;
  constructor(status: number, code: ErrorCode, extra: Omit<ErrorResponse['error'], 'code'> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const fail = (status: number, code: ErrorCode, extra?: Omit<ErrorResponse['error'], 'code'>) =>
  new HttpError(status, code, extra);

const answer = (reply: FastifyReply, status: number, code: ErrorCode, extra = {}) =>
  reply.code(status).send({ error: { code, ...extra } } satisfies ErrorResponse);

/** Installs the parsers, hooks and error handling. Call before mounting routes. */
export function harden(app: FastifyInstance, origins: string[]): void {
  app.removeAllContentTypeParsers();
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      done(null, body === '' ? undefined : strictJson(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'GET' || req.method === 'HEAD') return;
    const origin = req.headers.origin;
    const site = req.headers['sec-fetch-site'];
    if ((origin && !origins.includes(origin)) || site === 'cross-site') {
      return answer(reply, 403, 'forbiddenOrigin');
    }
  });

  app.addHook('onSend', async (_req, reply, payload) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) reply.header(k, v);
    return payload;
  });

  app.setErrorHandler((err: Error & { code?: string; statusCode?: number }, req, reply) => {
    if (err instanceof HttpError) return answer(reply, err.status, err.code, err.extra);
    if (err instanceof BadJson) return answer(reply, 400, 'invalidInput');
    if (err.code === 'FST_ERR_CTP_BODY_TOO_LARGE') return answer(reply, 413, 'tooLarge');
    if (err.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE' || err.code === 'FST_ERR_CTP_INVALID_CONTENT_LENGTH') {
      return answer(reply, 415, 'unsupportedType');
    }
    if (err.statusCode && err.statusCode < 500) return answer(reply, err.statusCode, 'invalidInput');
    req.log.error({ err }, 'unexpected error');
    return answer(reply, 500, 'serverError');
  });
}

export interface RouteContext<I> {
  req: FastifyRequest;
  reply: FastifyReply;
  input: I;
}

/** Mounts a route from its contract: method, path and input schema all come from the contract. */
export function contractRoute<I>(
  app: FastifyInstance,
  contract: RouteContract,
  handler: (ctx: RouteContext<I>) => unknown,
  preHandler?: (req: FastifyRequest) => void | Promise<void>,
): void {
  app.route({
    method: contract.method,
    url: contract.path,
    handler: async (req, reply) => {
      if (preHandler) await preHandler(req);
      let input = undefined as I;
      if (contract.input) {
        if (contract.method === 'POST' && !/^application\/json\b/.test(req.headers['content-type'] ?? '')) {
          throw fail(415, 'unsupportedType');
        }
        const parsed = contract.input.safeParse(req.body);
        if (!parsed.success) {
          throw fail(400, 'invalidInput', {
            fields: [...new Set(parsed.error.issues.map((i) => i.path.join('.') || '(body)'))],
          });
        }
        input = parsed.data as I;
      } else if (req.body !== undefined && req.body !== null) {
        throw fail(400, 'invalidInput', { fields: ['(body)'] });
      }
      return handler({ req, reply, input });
    },
  });
}
