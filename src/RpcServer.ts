import { Connection, Channel } from 'amqplib';
import { RpcServerConfig } from './config/RpcServerConfig';

export class RpcServer {
    private readonly _exchangeName: string;
    private readonly _config: RpcServerConfig;

    private _connection: Connection | undefined;
    private _channel: Channel | undefined;

    private readonly _routingTable = new Map<string, (input: any) => any>();

    constructor(exchangeName: string, config: RpcServerConfig) {
        this._exchangeName = exchangeName;
        this._config = config;

        this._config.endpoints.forEach(endpoint =>
            this._routingTable.set(endpoint.route, endpoint.handler),
        );
    }

    async start(connection: Connection) {
        this._connection = connection;

        this._channel = await this._connection.createChannel();
        await this.setupInfrastructure(this._channel);

        if (!this._config.queueName) throw { no_queue_name: true };

        this._channel.consume(this._config.queueName, async msg => {
            if (!msg) return;
            const channel = this._channel as Channel;

            const inputObj = JSON.parse(msg.content.toString());

            const handler = this._routingTable.get(msg.fields.routingKey);

            if (!handler) {
                channel.nack(msg);
                throw { no_handler: true, routingKey: msg.fields.routingKey };
            }

            const result = await handler(inputObj);

            const resultBytes = Buffer.from(JSON.stringify(result));

            channel.sendToQueue(msg.properties.replyTo, resultBytes, {
                correlationId: msg.properties.correlationId,
            });

            channel.ack(msg);
        });
    }

    private async setupInfrastructure(channel: Channel): Promise<void> {
        await channel.assertExchange(this._exchangeName, 'direct', { durable: false });

        if (!this._config.queueName) throw { no_queue_name: true };

        await channel.assertQueue(this._config.queueName, {
            durable: true,
            exclusive: false,
            autoDelete: false,
        });

        const endpoints = this._config.endpoints;
        for (let i = 0; i < endpoints.length; ++i) {
            await channel.bindQueue(this._config.queueName, this._exchangeName, endpoints[i].route);
        }
    }
}
