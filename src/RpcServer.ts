import { Connection, Channel } from "amqplib";
import { RpcEndpoint } from "./cfg/RpcEndpoint";

export class RpcServer {
    private readonly _queueName: string;
    private readonly _exchangeName: string;
    private readonly _connection: Connection;

    constructor(queueName: string, exchangeName: string, connection: Connection) {
        this._queueName = queueName;
        this._exchangeName = exchangeName;
        this._connection = connection;
    }

    public async setupEndpoints(endpoints: RpcEndpoint[]) {
        let channel = await this._connection.createChannel();
        await this.setupInfrastructure(channel);
        channel.close();

        endpoints.forEach(async endpoint => await this.setupEndpoint(endpoint));
    }

    private async setupEndpoint(endpoint: RpcEndpoint) : Promise<void> {
        let channel = await this._connection.createChannel();
        await channel.bindQueue(this._queueName, this._exchangeName, endpoint.route);

        channel.consume(this._queueName, msg => {
            let inputObj = JSON.parse(msg.content.toString());
            let result = endpoint.handler(inputObj);

            let resultBytes = Buffer.from(JSON.stringify(result));

            channel.sendToQueue(msg.properties.replyTo, resultBytes, {
                 correlationId: msg.properties.correlationId 
            });

            channel.ack(msg);
        });
    }

    private async setupInfrastructure(channel: Channel) : Promise<void> {
        await channel.assertExchange(this._exchangeName, "direct", { durable: false });

        await channel.assertQueue(this._queueName, {
            durable: true,
            exclusive: false,
            autoDelete: false
        });
    }
}