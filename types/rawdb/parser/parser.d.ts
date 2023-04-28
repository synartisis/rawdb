export function parse(ext: ItemType, content: string): ParseResult;
export function serialize(ext: string, object: CollectionItem): string;
export function isSupportedExtention(ext: string): ext is import("../../types.js").ItemType;
export type CollectionItem = import('../../types.js').CollectionItem;
export type ItemType = import('../../types.js').ItemType;
export type ParseResult = {
    body: string;
    bodySource: string;
    /**
     * // names of properties parsed in body
     */
    bodyProps: string[];
};
