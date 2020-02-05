import { connect, Connection } from 'amqplib';
import { IBus } from './IBus';
import { RpcClient } from './RpcClient';
import { RpcServer } from './RpcServer';
import { BusConfig } from './cfg/BusConfig';
import { IRpcClient } from './IRpcClient';

export class Bus implements IBus {
    private readonly _exchangeName: string;
    private readonly _connectionString: string;

    private readonly _busConfig: BusConfig;

    private _rpcClient: RpcClient;
    private _rpcServer: RpcServer;

    private _connection: Connection;

    constructor(connectionsString: string, exchangeName: string, busConfig: BusConfig) {
        this._exchangeName = exchangeName;
        this._connectionString = connectionsString;

        this._busConfig = busConfig;
    }

    public static async create(
        connectionsString: string,
        exchangeName: string,
        configure: (config: BusConfig) => void) : Promise<IBus> {

        let cfg = new BusConfig();
        configure(cfg);

        let bus = new Bus(connectionsString, exchangeName, cfg);

        await bus.connect();
        await bus.createRpcClient();
        await bus.createRpcServer();

        return bus;
    }

    public get rpcClient() : IRpcClient {
        return this._rpcClient;
    }

    public async connect() {
        this._connection = await connect(this._connectionString);

        this._connection.on("close", (err) => {
            if (err) {
                console.log("Critical error occured: ");
                console.log(err);
            }
        });

        this._connection.on("error", (err) => {
            console.log(err);
        });
    }

    private async createRpcClient() : Promise<void> {
        let client = await RpcClient.create(this._exchangeName, this._connection);
        this._rpcClient = client;
    }

    private async createRpcServer() : Promise<void> {
        let server = new RpcServer("AsyncMessagingConsole_RpcQueue", this._exchangeName, this._connection);
        await server.setupEndpoints(this._busConfig.endpoints);
    }
}