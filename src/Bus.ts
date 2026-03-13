import { connect, ChannelModel } from 'amqplib';
import { BusConfig } from './config/BusConfig';
import { IBus } from './IBus';
import { RpcClient } from './RpcClient';
import { RpcServer } from './RpcServer';
import { IRpcClient } from './IRpcClient';

export class Bus implements IBus {
    private readonly _exchangeName: string;
    private readonly _connectionString: string;

    private readonly _busConfig: BusConfig;

    private _rpcClient: RpcClient;
    private _rpcServer: RpcServer;

    private _channelModel: ChannelModel | undefined;

    constructor(
        connectionsString: string,
        exchangeName: string,
        config: BusConfig,
        rpcClient: RpcClient,
        rpcServer: RpcServer,
    ) {
        this._exchangeName = exchangeName;
        this._connectionString = connectionsString;
        this._rpcClient = rpcClient;
        this._rpcServer = rpcServer;

        this._busConfig = config;
    }

    static async create(
        connectionsString: string,
        exchangeName: string,
        configure: (config: BusConfig) => void,
    ): Promise<IBus> {
        const cfg = new BusConfig();
        configure(cfg);

        const rpcClient = new RpcClient(exchangeName, cfg.rpcClient);
        const rpcServer = new RpcServer(exchangeName, cfg.rpcServer);
        const bus = new Bus(connectionsString, exchangeName, cfg, rpcClient, rpcServer);

        await bus.connect();

        return bus;
    }

    async connect() {
        this._channelModel = await connect(this._connectionString);
        await this._rpcClient.start(this._channelModel);
        if (this._busConfig.rpcServer.queueName) {
            await this._rpcServer.start(this._channelModel);
        }

        this._channelModel.on('close', () => {
            console.log('RabbitMQ connection is closed. Trying to re-connect...');
            this.connect();
        });

        console.log('RabbitMQ is connected.');
    }

    public get rpcClient(): IRpcClient {
        return this._rpcClient;
    }
}
