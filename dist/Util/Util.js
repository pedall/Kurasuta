"use strict";
// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
exports.PRIMITIVE_TYPES = ['string', 'bigint', 'number', 'boolean'];
function chunk(entries, chunkSize) {
    const result = [];
    const amount = Math.floor(entries.length / chunkSize);
    const mod = entries.length % chunkSize;
    for (let i = 0; i < chunkSize; i++) {
        result[i] = entries.splice(0, i < mod ? amount + 1 : amount);
    }
    return result;
}
exports.chunk = chunk;
function deepClone(source) {
    // Check if it's a primitive (with exception of function and null, which is typeof object)
    if (source === null || isPrimitive(source))
        return source;
    if (Array.isArray(source)) {
        const output = [];
        for (const value of source)
            output.push(deepClone(value));
        return output;
    }
    if (isObject(source)) {
        const output = {};
        for (const [key, value] of Object.entries(source))
            output[key] = deepClone(value);
        return output;
    }
    if (source instanceof Map) {
        const output = new (source.constructor())();
        for (const [key, value] of source.entries())
            output.set(key, deepClone(value));
        return output;
    }
    if (source instanceof Set) {
        const output = new (source.constructor())();
        for (const value of source.values())
            output.add(deepClone(value));
        return output;
    }
    return source;
}
exports.deepClone = deepClone;
function isPrimitive(value) {
    return exports.PRIMITIVE_TYPES.includes(typeof value);
}
exports.isPrimitive = isPrimitive;
function mergeDefault(def, given) {
    if (!given)
        return deepClone(def);
    for (const key in def) {
        if (typeof given[key] === 'undefined')
            given[key] = deepClone(def[key]);
        else if (isObject(given[key]))
            given[key] = mergeDefault(def[key], given[key]);
    }
    return given;
}
exports.mergeDefault = mergeDefault;
function isObject(input) {
    return input && input.constructor === Object;
}
exports.isObject = isObject;
function sleep(duration) {
    return util_1.promisify(setTimeout)(duration);
}
exports.sleep = sleep;
function calcShards(shards, guildsPerShard) {
    return Math.ceil(shards * (1000 / guildsPerShard));
}
exports.calcShards = calcShards;
async function startCluster(manager) {
    const ClusterClassRequire = await Promise.resolve().then(() => __importStar(require(manager.path)));
    const ClusterClass = ClusterClassRequire.default ? ClusterClassRequire.default : ClusterClassRequire;
    const cluster = new ClusterClass(manager);
    return cluster.init();
}
exports.startCluster = startCluster;

//# sourceMappingURL=Util.js.map
