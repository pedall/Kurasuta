/// <reference types="node" />
import { CloseEvent } from '../Cluster/BaseCluster';
import { Client, ClientOptions } from 'discord.js';
import { MasterIPC } from '../IPC/MasterIPC';
import { Cluster } from '../Cluster/Cluster';
import { EventEmitter } from 'events';
export interface SharderOptions {
    token?: string;
    shardCount?: number | 'auto';
    clusterCount?: number;
    name?: string;
    development?: boolean;
    client?: typeof Client;
    clientOptions?: ClientOptions;
    guildsPerShard?: number;
    respawn?: boolean;
    ipcSocket?: string | number;
    timeout?: number;
}
export interface SessionObject {
    url: string;
    shards: number;
    session_start_limit: {
        total: number;
        remaining: number;
        reset_after: number;
    };
}
export declare class ShardingManager extends EventEmitter {
    path: string;
    clusters: Map<number, Cluster>;
    clientOptions: ClientOptions;
    shardCount: number | 'auto';
    guildsPerShard: number;
    client: typeof Client;
    clusterCount: number;
    ipcSocket: string | number;
    respawn: boolean;
    timeout: number;
    ipc: MasterIPC;
    private development;
    private token?;
    constructor(path: string, options: SharderOptions);
    spawn(): Promise<void>;
    restartAll(): Promise<void>;
    restart(clusterID: number): Promise<void>;
    fetchClientValues<T>(prop: string): Promise<T[]>;
    eval<T>(script: string): Promise<T>;
    on(event: 'debug', listener: (message: string) => void): this;
    on(event: 'message', listener: (message: any) => void): this;
    on(event: 'ready' | 'spawn', listener: (cluster: Cluster) => void): this;
    on(event: 'shardReady' | 'shardReconnect', listener: (shardID: number) => void): this;
    on(event: 'shardResumed', listener: (replayed: number, shardID: number) => void): this;
    on(event: 'shardDisconnect', listener: (closeEvent: CloseEvent, shardID: number) => void): this;
    once(event: 'debug', listener: (message: string) => void): this;
    once(event: 'message', listener: (message: any) => void): this;
    once(event: 'ready' | 'spawn', listener: (cluster: Cluster) => void): this;
    once(event: 'shardReady' | 'shardReconnect', listener: (shardID: number) => void): this;
    once(event: 'shardResumed', listener: (replayed: number, shardID: number) => void): this;
    once(event: 'shardDisconnect', listener: (closeEvent: CloseEvent, shardID: number) => void): this;
    private retryFailed;
    private _fetchSessionEndpoint;
}
