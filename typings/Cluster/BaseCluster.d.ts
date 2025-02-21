import { ShardingManager } from '..';
import { Client } from 'discord.js';
export interface CloseEvent {
    code: number;
    reason: string;
    wasClean: boolean;
}
export declare abstract class BaseCluster {
    manager: ShardingManager;
    readonly client: Client;
    readonly id: number;
    constructor(manager: ShardingManager);
    init(): Promise<void>;
    protected abstract launch(): Promise<void>;
}
