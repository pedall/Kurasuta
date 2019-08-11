"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const MasterIPC_1 = require("../IPC/MasterIPC");
const Cluster_1 = require("../Cluster/Cluster");
const Constants_1 = require("../Util/Constants");
const events_1 = require("events");
const os_1 = require("os");
const cluster_1 = require("cluster");
const Util = __importStar(require("../Util/Util"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class ShardingManager extends events_1.EventEmitter {
    constructor(path, options) {
        super();
        this.path = path;
        this.clusters = new Map();
        this.clusterCount = options.clusterCount || os_1.cpus().length;
        this.guildsPerShard = options.guildsPerShard || 1000;
        this.clientOptions = options.clientOptions || {};
        this.development = options.development || false;
        this.shardCount = options.shardCount || 'auto';
        this.client = options.client || discord_js_1.Client;
        this.respawn = options.respawn || true;
        this.ipcSocket = options.ipcSocket || 9999;
        this.token = options.token;
        this.timeout = options.timeout || 30000;
        this.ipc = new MasterIPC_1.MasterIPC(this);
        this.ipc.on('debug', msg => this.emit('debug', `[IPC] ${msg}`));
        this.ipc.on('error', err => this.emit('error', err));
        if (!this.path)
            throw new Error('You need to supply a Path!');
    }
    async spawn() {
        if (cluster_1.isMaster) {
            if (this.shardCount === 'auto') {
                this.emit('debug', 'Fetching Session Endpoint');
                const { shards: recommendShards } = await this._fetchSessionEndpoint();
                this.shardCount = Util.calcShards(recommendShards, this.guildsPerShard);
                this.emit('debug', `Using recommend shard count of ${this.shardCount} shards with ${this.guildsPerShard} guilds per shard`);
            }
            this.emit('debug', `Starting ${this.shardCount} Shards in ${this.clusterCount} Clusters!`);
            if (this.shardCount < this.clusterCount) {
                this.clusterCount = this.shardCount;
            }
            const shardArray = [...Array(this.shardCount).keys()];
            const shardTuple = Util.chunk(shardArray, this.clusterCount);
            const failed = [];
            for (let index = 0; index < this.clusterCount; index++) {
                const shards = shardTuple.shift();
                const cluster = new Cluster_1.Cluster({ id: index, shards, manager: this });
                this.clusters.set(index, cluster);
                try {
                    await cluster.spawn();
                }
                catch (error) {
                    this.emit('debug', `Cluster ${cluster.id} failed to start, enqueue and retry`);
                    this.emit('error', new Error(`Cluster ${cluster.id} failed to start`));
                    failed.push(cluster);
                }
            }
            await this.retryFailed(failed);
        }
        else {
            return Util.startCluster(this);
        }
    }
    async restartAll() {
        this.emit('debug', 'Restarting all Clusters!');
        for (const cluster of this.clusters.values()) {
            await cluster.respawn();
        }
    }
    async restart(clusterID) {
        const cluster = this.clusters.get(clusterID);
        if (!cluster)
            throw new Error('No Cluster with that ID found.');
        this.emit('debug', `Restarting Cluster ${clusterID}`);
        await cluster.respawn();
    }
    fetchClientValues(prop) {
        return this.ipc.broadcast(`this.${prop}`);
    }
    eval(script) {
        return new Promise((resolve, reject) => {
            try {
                // tslint:disable-next-line:no-eval
                return resolve(eval(script));
            }
            catch (error) {
                reject(error);
            }
        });
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
    async retryFailed(clusters) {
        const failed = [];
        for (const cluster of clusters) {
            try {
                await cluster.respawn();
            }
            catch (error) {
                failed.push(cluster);
            }
        }
        if (failed.length)
            return this.retryFailed(failed);
    }
    async _fetchSessionEndpoint() {
        if (!this.token)
            throw new Error('No token was provided!');
        const res = await node_fetch_1.default(`${Constants_1.http.api}/v${Constants_1.http.version}/gateway/bot`, {
            method: 'GET',
            headers: { Authorization: `Bot ${this.token.replace(/^Bot\s*/i, '')}` },
        });
        if (res.ok)
            return res.json();
        throw res;
    }
}
exports.ShardingManager = ShardingManager;
