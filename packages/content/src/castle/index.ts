// Castle Clash's static configuration: `bastionConfig`, the one object the engine, the server and the
// page read (docs/castle-clash/). Numbers in constants.ts, content in content.ts.
import * as constants from './constants.ts';
import * as content from './content.ts';

export * from './constants.ts';
export * from './content.ts';

export const bastionConfig = { ...constants, ...content } as const;
export type BastionConfig = typeof bastionConfig;
