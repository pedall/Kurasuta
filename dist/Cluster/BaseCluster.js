"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShardClientUtil_1 = require("../Sharding/ShardClientUtil");
const Constants_1 = require("../Util/Constants");
const Util = __importStar(require("../Util/Util"));
class BaseCluster {
    constructor(manager) {
        this.manager = manager;
        const env = process.env;
        const shards = env.CLUSTER_SHARDS.split(',').map(Number);
        const clientConfig = Util.mergeDefault(manager.clientOptions, {
            shards,
            shardCount: shards.length,
            totalShardCount: Number(env.CLUSTER_SHARD_COUNT)
        });
        this.client = new manager.client(clientConfig);
        const client = this.client;
        client.shard = new ShardClientUtil_1.ShardClientUtil(client, manager.ipcSocket);
        this.id = Number(env.CLUSTER_ID);
    }
    async init() {
        const shardUtil = this.client.shard;
        await shardUtil.init();
        this.client.once('ready', () => shardUtil.send({ op: Constants_1.IPCEvents.READY, d: this.id }, { receptive: false }));
        this.client.on('shardReady', id => shardUtil.send({ op: Constants_1.IPCEvents.SHARDREADY, d: { id: this.id, shardID: id } }, { receptive: false }));
        this.client.on('shardReconnecting', id => shardUtil.send({ op: Constants_1.IPCEvents.SHARDRECONNECT, d: { id: this.id, shardID: id } }, { receptive: false }));
        this.client.on('shardResume', (id, replayed) => shardUtil.send({ op: Constants_1.IPCEvents.SHARDRESUME, d: { id: this.id, shardID: id, replayed } }, { receptive: false }));
        this.client.on('shardDisconnect', (closeEvent, id) => shardUtil.send({ op: Constants_1.IPCEvents.SHARDDISCONNECT, d: { id: this.id, shardID: id, closeEvent } }, { receptive: false }));
        await this.launch();
    }
}
exports.BaseCluster = BaseCluster;

//# sourceMappingURL=BaseCluster.js.map
