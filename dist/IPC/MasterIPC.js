"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const veza_1 = require("veza");
const discord_js_1 = require("discord.js");
const cluster_1 = require("cluster");
const Constants_1 = require("../Util/Constants");
class MasterIPC extends events_1.EventEmitter {
    constructor(manager) {
        super();
        this.manager = manager;
        this.node = new veza_1.Node('Master')
            .on('client.identify', client => this.emit('debug', `Client Connected: ${client.name}`))
            .on('client.disconnect', client => this.emit('debug', `Client Disconnected: ${client.name}`))
            .on('client.destroy', client => this.emit('debug', `Client Destroyed: ${client.name}`))
            .on('error', error => this.emit('error', error))
            .on('message', this._incommingMessage.bind(this));
        if (cluster_1.isMaster)
            this.node.serve(manager.ipcSocket);
    }
    async broadcast(code) {
        const data = await this.node.broadcast({ op: Constants_1.IPCEvents.EVAL, d: code });
        let errored = data.filter(res => !res.success);
        if (errored.length) {
            errored = errored.map(msg => msg.d);
            const error = errored[0];
            throw discord_js_1.Util.makeError(error);
        }
        return data.map(res => res.d);
    }
    _incommingMessage(message) {
        const { op } = message.data;
        this[`_${Constants_1.IPCEvents[op].toLowerCase()}`](message);
    }
    _message(message) {
        const { d } = message.data;
        this.manager.emit('message', d);
    }
    // new method to run custom ipcPieces
    async _request(message) {
        const { d, route } = message.data;
        try {
            let data = await this.node.broadcast({ op: Constants_1.IPCEvents.REQUEST, d, route });
            let errored = data.filter(res => !res.success);
            // TODO: maybe add some more data what shard could not fulfill the request
            data = data.map(res => res.d);
            message.reply({ success: true, d: data, route });
        }
        catch (error) {
            message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack }, route });
        }
    }
    async _broadcast(message) {
        const { d } = message.data;
        try {
            const data = await this.broadcast(d);
            message.reply({ success: true, d: data });
        }
        catch (error) {
            message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } });
        }
    }
    _ready(message) {
        const { d: id } = message.data;
        const cluster = this.manager.clusters.get(id);
        cluster.emit('ready');
        this.manager.emit('debug', `Cluster ${id} became ready`);
        this.manager.emit('ready', cluster);
    }
    _shardready(message) {
        const { d: { shardID } } = message.data;
        this.manager.emit('debug', `Shard ${shardID} became ready`);
        this.manager.emit('shardReady', shardID);
    }
    _shardreconnect(message) {
        const { d: { shardID } } = message.data;
        this.manager.emit('debug', `Shard ${shardID} tries to reconnect`);
        this.manager.emit('shardReconnect', shardID);
    }
    _shardresumed(message) {
        const { d: { shardID, replayed } } = message.data;
        this.manager.emit('debug', `Shard ${shardID} resumed connection`);
        this.manager.emit('shardResumed', replayed, shardID);
    }
    _sharddisconnect(message) {
        const { d: { shardID, closeEvent } } = message.data;
        this.manager.emit('debug', `Shard ${shardID} disconnected!`);
        this.manager.emit('shardDisconnect', closeEvent, shardID);
    }
    _restart(message) {
        const { d: clusterID } = message.data;
        return this.manager.restart(clusterID)
            .then(() => message.reply({ success: true }))
            .catch(error => message.reply({ success: false, data: { name: error.name, message: error.message, stack: error.stack } }));
    }
    async _mastereval(message) {
        const { d } = message.data;
        try {
            const result = await this.manager.eval(d);
            return message.reply({ success: true, d: result });
        }
        catch (error) {
            return message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } });
        }
    }
    _restartall() {
        this.manager.restartAll();
    }
    async _fetchuser(message) {
        return this._fetch(message, 'const user = this.users.get(\'{id}\'); user ? user.toJSON() : user;');
    }
    async _fetchguild(message) {
        return this._fetch(message, 'const guild = this.guilds.get(\'{id}\'); guild ? guild.toJSON() : guild;');
    }
    _fetchchannel(message) {
        return this._fetch(message, 'const channel = this.channels.get(\'{id}\'); channel ? channel.toJSON() : channel;');
    }
    async _fetch(message, code) {
        const { d: id } = message.data;
        const result = await this.broadcast(code.replace('{id}', id));
        const realResult = result.filter(r => r);
        if (realResult.length) {
            return message.reply({ success: true, d: realResult[0] });
        }
        return message.reply({ success: false });
    }
}
exports.MasterIPC = MasterIPC;

//# sourceMappingURL=MasterIPC.js.map
