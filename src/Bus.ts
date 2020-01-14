import { connect } from 'amqplib/channel_api';

import { IBus } from './IBus';
import { RpcClient } from './RpcClient';
import { RpcServer } from './RpcServer';

export class Bus implements IBus {
    private readonly _exchangeName: string;
    private readonly _connectionString: string;

    private _connection: any;

    constructor(connectionsString: string, exchangeName: string) {
        this._exchangeName = exchangeName;
        this._connectionString = connectionsString;
    }

    async connect() {
        this._connection = await connect(this._connectionString);
    }

    createRpcServer(queueName: string) {
        let rpcServer = new RpcServer(queueName, this._exchangeName, this._connection);

        return rpcServer;
    }

    async createRpcClient() {
        return await RpcClient.create(this._exchangeName, this._connection);
    }
}