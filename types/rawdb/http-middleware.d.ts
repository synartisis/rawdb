/** @param {string} rootUrl  */
export function httpMiddleware(rootUrl: string): (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
    locals: string;
}) => Promise<void>;
export const RAWDB_ENDPOINT: "/rawdb";
import * as http from 'node:http';
