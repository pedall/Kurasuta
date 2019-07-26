/// <reference types="node" />
import { Worker } from 'cluster';
import { ShardingManager } from '..';
import { EventEmitter } from 'events';
export interface ClusterOptions {
    id: number;
    shards: number[];
    manager: ShardingManager;
}
export declare class Cluster extends EventEmitter {
    ready: boolean;
    id: number;
    shards: number[];
    worker?: Worker;
    manager: ShardingManager;
    private _exitListenerFunction;
    constructor(options: ClusterOptions);
    eval(script: string | Function): Promise<any>;
    fetchClientValue(prop: string): Promise<any>;
    kill(): void;
    respawn(delay?: number): Promise<void>;
    send(data: object): Promise<any>;
    spawn(): Promise<void>;
    private _exitListener;
    private _waitReady;
}
