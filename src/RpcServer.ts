import { Connection, Channel } from "amqplib";
import { RpcEndpoint } from "./cfg/RpcEndpoint";

export class RpcServer {
    private readonly _queueName: string;
    private readonly _exchangeName: string;

    private _connection: Connection;
    private _channel: Channel;

    private readonly _endpoints: RpcEndpoint[] = [];
    private readonly _routingTable = new Map<string, (input: any) => any>();

    constructor(exchangeName: string, queueName: string, endpoints: RpcEndpoint[]) {
        this._queueName = queueName;
        this._exchangeName = exchangeName;

        Array.prototype.push.apply(this._endpoints, endpoints);
        this._endpoints.forEach(endpoint => this._routingTable.set(endpoint.route, endpoint.handler));
    }

    public async start(connection: Connection) {
        this._connection = connection;

        this._channel = await this._connection.createChannel();
        await this.setupInfrastructure(this._channel);

        this._channel.consume(this._queueName, msg => {
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

        await channel.assertQueue(this._queueName, {
            durable: true,
            exclusive: false,
            autoDelete: false
        });

        for (let i = 0; i < this._endpoints.length; ++i) {
            await channel.bindQueue(this._queueName, this._exchangeName, this._endpoints[i].route);
        }
    }
}