/// <reference types="node" />
import { EventEmitter } from 'events';
import { Node } from 'veza';
import { ShardingManager } from '..';
export declare class MasterIPC extends EventEmitter {
    manager: ShardingManager;
    [key: string]: any;
    node: Node;
    constructor(manager: ShardingManager);
    broadcast<T>(code: string): Promise<T[]>;
    private _incommingMessage;
    private _message;
    private _request;
    private _broadcast;
    private _ready;
    private _shardready;
    private _shardreconnect;
    private _shardresumed;
    private _sharddisconnect;
    private _restart;
    private _mastereval;
    private _restartall;
    private _fetchuser;
    private _fetchguild;
    private _fetchchannel;
    private _fetch;
}
