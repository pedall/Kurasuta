"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = require("cluster");
const Constants_1 = require("../Util/Constants");
const discord_js_1 = require("discord.js");
const Util = __importStar(require("../Util/Util"));
const events_1 = require("events");
class Cluster extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.ready = false;
        this.id = options.id;
        this.shards = options.shards;
        this.manager = options.manager;
        this._exitListenerFunction = this._exitListener.bind(this);
        this.once('ready', () => { this.ready = true; });
    }
    async eval(script) {
        script = typeof script === 'function' ? `(${script})(this)` : script;
        const { success, d } = await this.manager.ipc.server.sendTo(`Cluster ${this.id}`, { op: Constants_1.IPCEvents.EVAL, d: script });
        if (!success)
            throw discord_js_1.Util.makeError(d);
        return d;
    }
    async fetchClientValue(prop) {
        const { success, d } = await this.manager.ipc.server.sendTo(`Cluster ${this.id}`, { op: Constants_1.IPCEvents.EVAL, d: `this.${prop}` });
        if (!success)
            throw discord_js_1.Util.makeError(d);
        return d;
    }
    kill() {
        if (this.worker) {
            this.manager.emit('debug', `Killing Cluster ${this.id}`);
            this.worker.removeListener('exit', this._exitListenerFunction);
            this.worker.kill();
        }
    }
    async respawn(delay = 500) {
        this.kill();
        if (delay)
            await discord_js_1.Util.delayFor(delay);
        await this.spawn();
    }
    send(data) {
        return this.manager.ipc.node.sendTo(`Cluster ${this.id}`, data);
    }
    async spawn() {
        this.worker = cluster_1.fork({ CLUSTER_SHARDS: this.shards.join(','), CLUSTER_ID: this.id, CLUSTER_SHARD_COUNT: this.manager.shardCount, CLUSTER_CLUSTER_COUNT: this.manager.clusterCount });
        this.worker.once('exit', this._exitListenerFunction);
        this.manager.emit('debug', `Worker spawned with id ${this.worker.id}`);
        this.manager.emit('spawn', this);
        await this._waitReady(this.shards.length);
        await Util.sleep(5000);
    }
    _exitListener(code, signal) {
        this.ready = false;
        this.worker = undefined;
        if (this.manager.respawn)
            this.respawn();
        this.manager.emit('debug', `Worker exited with code ${code} and signal ${signal}${this.manager.respawn ? ', restarting...' : ''}`);
    }
    _waitReady(shardCount) {
        return new Promise((resolve, reject) => {
            this.once('ready', resolve);
            setTimeout(() => reject(new Error(`Cluster ${this.id} took too long to get ready`)), (this.manager.timeout * shardCount) * (this.manager.guildsPerShard / 1000));
        });
    }
}
exports.Cluster = Cluster;

//# sourceMappingURL=Cluster.js.map
