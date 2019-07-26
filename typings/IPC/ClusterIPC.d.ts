/// <reference types="node" />
import { EventEmitter } from 'events';
import { Node, NodeSocket } from 'veza';
import { Client } from 'discord.js';
export declare class ClusterIPC extends EventEmitter {
    id: number;
    socket: string | number;
    nodeSocket?: NodeSocket;
    client: Client;
    node: Node;
    constructor(discordClient: Client, id: number, socket: string | number);
    broadcast<T>(script: string | Function): Promise<T[]>;
    masterEval<T>(script: string | Function): Promise<T>;
    init(): Promise<void>;
    readonly server: NodeSocket;
    private _eval;
    private _message;
}
