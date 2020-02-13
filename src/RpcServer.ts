import { Connection, Channel } from "amqplib";
import { RpcServerConfig } from "./config/RpcServerConfig";

export class RpcServer {
    private readonly _exchangeName: string;
    private readonly _config: RpcServerConfig;

    private _connection: Connection;
    private _channel: Channel;

    private readonly _routingTable = new Map<string, (input: any) => any>();

    constructor(exchangeName: string, config: RpcServerConfig) {
        this._exchangeName = exchangeName;
        this._config = config;

        this._config
            .endpoints
            .forEach(endpoint => this._routingTable.set(endpoint.route, endpoint.handler));
    }

    public async start(connection: Connection) {
        this._connection = connection;

        this._channel = await this._connection.createChannel();
        await this.setupInfrastructure(this._channel);

        this._channel.consume(this._config.queueName, msg => {
            let inputObj = JSON.parse(msg.content.toString());

            let handler = this._routingTable.get(msg.fields.routingKey);
            let result = handler(inputObj); 

            let resultBytes = Buffer.from(JSON.stringify(result));

            this._channel.sendToQueue(msg.properties.replyTo, resultBytes, {
                 correlationId: msg.properties.correlationId 
            });

            this._channel.ack(msg);
        });
    }

    private async setupInfrastructure(channel: Channel) : Promise<void> {
        await channel.assertExchange(this._exchangeName, "direct", { durable: false });

        await channel.assertQueue(this._config.queueName, {
            durable: true,
            exclusive: false,
            autoDelete: false
        });

        let endpoints = this._config.endpoints;
        for (let i = 0; i < endpoints.length; ++i) {
            await channel.bindQueue(this._config.queueName, this._exchangeName, endpoints[i].route);
        }
    }
}