import { ShardingManager } from '..';
export interface AnyObj {
    [key: string]: any;
}
export declare const PRIMITIVE_TYPES: string[];
export declare function chunk<T>(entries: T[], chunkSize: number): T[][];
export declare function deepClone(source: any): any;
export declare function isPrimitive(value: any): boolean;
export declare function mergeDefault<T>(def: AnyObj, given: AnyObj): T;
export declare function isObject(input: any): boolean;
export declare function sleep(duration: number): Promise<void>;
export declare function calcShards(shards: number, guildsPerShard: number): number;
export declare function startCluster(manager: ShardingManager): Promise<void>;
