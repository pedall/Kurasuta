"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const veza_1 = require("veza");
const discord_js_1 = require("discord.js");
const Constants_1 = require("../Util/Constants");
class ClusterIPC extends events_1.EventEmitter {
    constructor(discordClient, id, socket) {
        super();
        this.id = id;
        this.socket = socket;
        this.client = discordClient;
        this.node = new veza_1.Node(`Cluster ${this.id}`)
            .on('error', error => this.emit('error', error))
            .on('client.disconnect', client => this.emit('warn', `[IPC] Disconnected from ${client.name}`))
            .on('client.ready', client => this.emit('debug', `[IPC] Connected to: ${client.name}`))
            .on('message', this._message.bind(this));
    }
    async broadcast(script) {
        script = typeof script === 'function' ? `(${script})(this)` : script;
        const { success, d } = await this.server.send({ op: Constants_1.IPCEvents.BROADCAST, d: script });
        if (!success)
            throw discord_js_1.Util.makeError(d);
        return d;
    }
    async masterEval(script) {
        script = typeof script === 'function' ? `(${script})(this)` : script;
        const { success, d } = await this.server.send({ op: Constants_1.IPCEvents.MASTEREVAL, d: script });
        if (!success)
            throw discord_js_1.Util.makeError(d);
        return d;
    }
    async init() {
        this.nodeSocket = await this.node.connectTo('Master', String(this.socket));
    }
    get server() {
        return this.nodeSocket;
    }
    _eval(script) {
        const client = this.client;
        return client._eval(script);
    }
    async _message(message) {
        const { op, d, route } = message.data;
        if (op === Constants_1.IPCEvents.EVAL) {
            try {
                message.reply({ success: true, d: await this._eval(d) });
            }
            catch (error) {
                message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } });
            }
        }
        else if (op === Constants_1.IPCEvents.REQUEST) {
            try {
                this.client.ipcPieces.run(message);
            }
            catch (error) {
                message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack }, route });
            }
        }
    }
}
exports.ClusterIPC = ClusterIPC;

//# sourceMappingURL=ClusterIPC.js.map
