/**
 * rawdb http middleware
 * @param rootDir The root directory of rawdb's content
 */
export function rawdb(rootDir: string): Promise<rawdb.RequestListener>
