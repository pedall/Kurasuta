import { Client } from 'discord.js';
import { SendOptions } from 'veza';
import { ClusterIPC } from '../IPC/ClusterIPC';
export interface IPCResult {
    success: boolean;
    d: any;
}
export declare class ShardClientUtil {
    client: Client;
    ipcSocket: string | number;
    readonly clusterCount: number;
    readonly shardCount: number;
    readonly id: number;
    readonly ipc: ClusterIPC;
    constructor(client: Client, ipcSocket: string | number);
    broadcastEval<T>(script: string | Function): Promise<T[]>;
    masterEval<T>(script: string | Function): Promise<T>;
    fetchClientValues(prop: string): Promise<any[]>;
    fetchGuild(id: string): Promise<object>;
    fetchUser(id: string): Promise<object>;
    fetchChannel(id: string): Promise<object>;
    restartAll(): Promise<void>;
    restart(clusterID: number): Promise<void>;
    send<T>(data: any, options?: SendOptions): Promise<T>;
    init(): Promise<void>;
}
