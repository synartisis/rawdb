export function parse(content: string): ParseResult;
export function serialize(item: CollectionItem): string;
export type ParseResult = import("../parser.js").ParseResult;
export type CollectionItem = import("../../../types.js").CollectionItem;
