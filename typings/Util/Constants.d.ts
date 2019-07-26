export declare const http: {
    version: number;
    api: string;
};
export declare const version = "0.2.18";
export declare enum IPCEvents {
    EVAL = 0,
    MESSAGE = 1,
    BROADCAST = 2,
    READY = 3,
    SHARDREADY = 4,
    SHARDRECONNECT = 5,
    SHARDRESUMED = 6,
    SHARDDISCONNECT = 7,
    MASTEREVAL = 8,
    RESTARTALL = 9,
    RESTART = 10,
    FETCHUSER = 11,
    FETCHCHANNEL = 12,
    FETCHGUILD = 13,
    REQUEST = 14
}
