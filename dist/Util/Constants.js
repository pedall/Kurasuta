"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.http = {
    version: 7,
    api: 'https://discordapp.com/api'
};
exports.version = '0.2.18';
var IPCEvents;
(function (IPCEvents) {
    IPCEvents[IPCEvents["EVAL"] = 0] = "EVAL";
    IPCEvents[IPCEvents["MESSAGE"] = 1] = "MESSAGE";
    IPCEvents[IPCEvents["BROADCAST"] = 2] = "BROADCAST";
    IPCEvents[IPCEvents["READY"] = 3] = "READY";
    IPCEvents[IPCEvents["SHARDREADY"] = 4] = "SHARDREADY";
    IPCEvents[IPCEvents["SHARDRECONNECT"] = 5] = "SHARDRECONNECT";
    IPCEvents[IPCEvents["SHARDRESUMED"] = 6] = "SHARDRESUMED";
    IPCEvents[IPCEvents["SHARDDISCONNECT"] = 7] = "SHARDDISCONNECT";
    IPCEvents[IPCEvents["MASTEREVAL"] = 8] = "MASTEREVAL";
    IPCEvents[IPCEvents["RESTARTALL"] = 9] = "RESTARTALL";
    IPCEvents[IPCEvents["RESTART"] = 10] = "RESTART";
    IPCEvents[IPCEvents["FETCHUSER"] = 11] = "FETCHUSER";
    IPCEvents[IPCEvents["FETCHCHANNEL"] = 12] = "FETCHCHANNEL";
    IPCEvents[IPCEvents["FETCHGUILD"] = 13] = "FETCHGUILD";
    IPCEvents[IPCEvents["REQUEST"] = 14] = "REQUEST";
})(IPCEvents = exports.IPCEvents || (exports.IPCEvents = {}));
