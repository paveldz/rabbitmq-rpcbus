import { connect, Connection } from 'amqplib';
import { IBus } from './IBus';
import { RpcClient } from './RpcClient';
import { RpcServer } from './RpcServer';
import { RpcServerConfig } from './cfg/RpcServerConfig';
import { IRpcClient } from './IRpcClient';

export class Bus implements IBus {
    private readonly _exchangeName: string;
    private readonly _connectionString: string;

    private readonly _rpcServerConfig: RpcServerConfig;

    private _rpcClient: RpcClient;
    private _rpcServer: RpcServer;

    private _connection: Connection;

    constructor(connectionsString: string, exchangeName: string, rpcServerConfig: RpcServerConfig) {
        this._exchangeName = exchangeName;
        this._connectionString = connectionsString;

        this._rpcServerConfig = rpcServerConfig;
    }

    public static async create(
        connectionsString: string,
        exchangeName: string,
        configure: (config: RpcServerConfig) => void) : Promise<IBus> {

        let cfg = new RpcServerConfig();
        configure(cfg);

        let bus = new Bus(connectionsString, exchangeName, cfg);

        bus._rpcClient = new RpcClient(exchangeName);
        bus._rpcServer = new RpcServer(exchangeName, cfg.rpcServerQueueName, cfg.endpoints);

        await bus.connect();
        return bus;
    }

    public get rpcClient() : IRpcClient {
        return this._rpcClient;
    }

    public async connect() {
        this._connection = await connect(this._connectionString);
        await this._rpcClient.start(this._connection);
        await this._rpcServer.start(this._connection);

        this._connection.on("close", () => {
            console.log("RabbitMQ connection is closed. Trying to re-connect...");
            this.connect();
        });

        console.log("RabbitMQ is connected.");
    }
}