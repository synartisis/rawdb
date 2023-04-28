/// <reference types="node" resolution-mode="require"/>
/** @typedef {import('./types.js').Config} Config */
/**
 * rawdb configuration and loading
 * must run before start using rawdb
 * @param {Config} config configuration settings
 * @example rawdb.config({ rootDir: 'my_content/' })
 */
export function config({ rootDir }: Config): Promise<void>;
/**
 * rawdb http middleware
 *
 * attaches rawdb data on http.ServerResponse.locals for use in UI databinding
 * @example server.use(rawdb.middleware())
 * */
export function middleware(): (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage> & {
    locals: string;
}) => Promise<void>;
export type Config = import('./types.js').Config;
