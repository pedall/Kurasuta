import { Cluster } from './Cluster';
import { EventEmitter } from 'events';
import { cpus } from 'os';
import { Client, ClientOptions } from 'discord.js';
import { Util } from '../util/Util';
import { isMaster, fork, Worker } from 'cluster';
import { IPC } from './IPC';
import fetch from 'node-fetch';
import { http } from '../util/Constants';

export const { version } = require('../../package.json');

export type SharderOptions = {
	token: string;
	path: string;
	shardCount?: number | 'auto';
	clusterCount?: number;
	name?: string;
	development?: boolean;
	client?: typeof Client,
	clientOptions?: ClientOptions;
	guildsPerShard?: number,
	respawn?: boolean;
};

export type ClusterInfo = {
	worker: Worker;
	shards: number[];
	ready: boolean;
	id: number;
};

export type SessionObject = {
	url: string;
	shards: number;
	session_start_limit: {
		total: number;
		remaining: number;
		reset_after: number;
	}
};

export class ShardingManager extends EventEmitter {
	public clusters = new Map<number, ClusterInfo>();
	public clientOptions: ClientOptions;
	public shardCount: number | 'auto';
	public guildsPerShard: number;
	public client: typeof Client;
	public clusterCount: number;
	public development: boolean;
	public respawn: boolean;
	public token: string;
	public path: string;
	public ipc: IPC;

	constructor(options: SharderOptions) {
		super();
		this.token = options.token;
		this.path = options.path;
		this.shardCount = options.shardCount || 'auto';
		this.clusterCount = options.clusterCount || cpus().length;
		this.development = options.development || false;
		this.client = options.client || Client;
		this.clientOptions = options.clientOptions || {};
		this.ipc = new IPC({ manager: this });
		this.guildsPerShard = options.guildsPerShard || 1000;
		this.respawn = options.respawn || true;

		this.ipc.on('debug', msg => this.emit('debug', msg));

		if (!this.token) throw new Error('You need to supply a Token!');
		if (!this.path) throw new Error('You need to supply a Path!');
	}

	public async spawn(): Promise<void> {
		if (isMaster) {
			this.emit('debug', 'Fetching Session Endpoint');
			const { shards: recommendShards, session_start_limit: { remaining } } = await this.fetchSessionEndpoint();

			if (remaining < this.shardCount) throw new Error('Daily session limit exceeded!');

			if (this.shardCount === 'auto') {
				this.shardCount = await this.calcShards(recommendShards, this.guildsPerShard);
				this.emit('debug', `Using recommend shard count of ${this.shardCount} shards with ${this.guildsPerShard} guilds per shard`);
			}

			this.emit('debug', `Starting ${this.shardCount} Shards in ${this.clusterCount} Clusters!`);

			const shardsPerCluster = Math.round(this.shardCount / this.clusterCount);
			const shardArray = [...Array(this.shardCount).keys()];
			const shardTuple = Util.chunk(shardArray, shardsPerCluster);
			for (let index = 0; index < this.clusterCount; index++) {
				const shards = shardTuple.shift()!;
				const worker = fork({ CLUSTER_SHARDS: shards.join(','), CLUSTER_ID: index, CLUSTER_SHARDCOUNT: this.shardCount, CLUSTER_CLUSTERCOUNT: this.clusterCount });

				this.emit('debug', `Worker spawned with id ${worker.id}`);

				const clusterInfo: ClusterInfo = { worker, shards, ready: false, id: index };
				if (this.respawn) worker.on('exit', (code, signal) => {
					this.emit('debug', `Worker exited with code ${code} and signal ${signal}, restarting ...`);
					this.clusters.delete(index);
					this.spawnSpecific(clusterInfo);
				});

				this.emit('spawn', clusterInfo);

				this.clusters.set(index, clusterInfo);

				await this._waitReady(shards.length, index);
				await Util.sleep(5000);
			}
		} else {
			this._run();
		}
	}

	public async spawnSpecific(cluster: ClusterInfo): Promise<void> {
		if (isMaster) {
			this.emit('debug', `Spawning specific Cluster ${cluster.id}`);

			const worker = fork({ CLUSTER_SHARDS: cluster.shards.join(','), CLUSTER_ID: cluster.id, CLUSTER_SHARDCOUNT: this.shardCount, CLUSTER_CLUSTERCOUNT: this.clusterCount });
			this.emit('debug', `Worker spawned with id ${worker.id}`);

			this.clusters.set(worker.id, { worker, shards: cluster.shards, ready: false, id: worker.id });
			await this._waitReady(cluster.shards.length, cluster.id);
		} else {
			this._run();
		}
	}

	public restartAll(): void {
		this.emit('debug', 'Respawning all Clusters!');

		for (const workerInfo of this.clusters.values()) {
			const { worker } = workerInfo;
			worker.kill();
		}

		this.clusters.clear();

		this.spawn();
	}

	public async restart(clusterID: number): Promise<void> {
		this.emit('debug', `Respawn Cluster ${clusterID}`);

		const clusterInfo = this.clusters.get(clusterID);
		if (!clusterInfo) throw new Error('No Cluster with that ID found.');
		const { worker } = clusterInfo;

		if (!worker.isDead) worker.kill();
		await this.spawnSpecific(clusterInfo);
	}

	public fetchClientValues<T>(prop: string): Promise<T[]> {
		return this.ipc.getResultFromNodes(`this.${prop}`);
	}

	private calcShards(shards: number, guildsPerShard = 1000): number {
		return shards * (1000 / guildsPerShard);
	}

	private async fetchSessionEndpoint(): Promise<SessionObject> {
		const res = await fetch(`${http.api}/v${http.version}/gateway/bot`, {
			method: 'GET',
			headers: { Authorization: `Bot ${this.token.replace(/^Bot\s*/i, '')}` },
		});
		if (res.ok)
			return res.json();
		throw res;
	}

	private _run(): void {
		const ClusterClass = require(this.path);
		const cluster: Cluster = new ClusterClass(this);
		cluster.init();
	}

	private _waitReady(shardCount: number, clusterID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			this.once('ready', resolve);
			setTimeout(() => reject(new Error(`Cluster ${clusterID} took too long to get ready`)), (7500 * shardCount) * (this.guildsPerShard / 1000));
		});
	}
}
