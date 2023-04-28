export function setState(res: Response, maybeCollectionUrl: string, maybeId: string): Promise<void>;
export type Response = import('node:http').ServerResponse & {
    locals: string;
};
export type State = import('../types.js').State;
