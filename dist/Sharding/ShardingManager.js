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
        this.retry = options.retry || true;
        this.timeout = options.timeout || 30000;
        this.token = options.token;
        this.ipc = new MasterIPC_1.MasterIPC(this);
        this.ipc.on('debug', msg => this._debug(`[IPC] ${msg}`));
        this.ipc.on('error', err => this.emit(Constants_1.SharderEvents.ERROR, err));
        if (!this.path)
            throw new Error('You need to supply a Path!');
    }
    async spawn() {
        if (cluster_1.isMaster) {
            if (this.shardCount === 'auto') {
                this._debug('Fetching Session Endpoint');
                const { shards: recommendShards } = await this._fetchSessionEndpoint();
                this.shardCount = Util.calcShards(recommendShards, this.guildsPerShard);
                this._debug(`Using recommend shard count of ${this.shardCount} shards with ${this.guildsPerShard} guilds per shard`);
            }
            this._debug(`Starting ${this.shardCount} Shards in ${this.clusterCount} Clusters!`);
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
                catch (_a) {
                    this._debug(`Cluster ${cluster.id} failed to start`);
                    this.emit(Constants_1.SharderEvents.ERROR, new Error(`Cluster ${cluster.id} failed to start`));
                    if (this.retry) {
                        this._debug(`Requeuing Cluster ${cluster.id} to be spawned`);
                        failed.push(cluster);
                    }
                }
            }
            if (this.retry)
                await this.retryFailed(failed);
        }
        else {
            return Util.startCluster(this);
        }
    }
    async restartAll() {
        this._debug('Restarting all Clusters!');
        for (const cluster of this.clusters.values()) {
            await cluster.respawn();
        }
    }
    async restart(clusterID) {
        const cluster = this.clusters.get(clusterID);
        if (!cluster)
            throw new Error('No Cluster with that ID found.');
        this._debug(`Restarting Cluster ${clusterID}`);
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
                this._debug(`Respawning Cluster ${cluster.id}`);
                await cluster.respawn();
            }
            catch (_a) {
                this._debug(`Cluster ${cluster.id} failed, requeuing...`);
                failed.push(cluster);
            }
        }
        if (failed.length) {
            this._debug(`${failed.length} Clusters still failed, retry...`);
            return this.retryFailed(failed);
        }
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
    _debug(message) {
        this.emit(Constants_1.SharderEvents.DEBUG, message);
    }
}
exports.ShardingManager = ShardingManager;

//# sourceMappingURL=ShardingManager.js.map
