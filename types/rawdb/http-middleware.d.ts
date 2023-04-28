/// <reference types="node" resolution-mode="require"/>
export function httpMiddleware(): (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
    locals: string;
}) => Promise<void>;
export const RAWDB_ENDPOINT: "/rawdb";
import * as http from 'node:http';
