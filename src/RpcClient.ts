import { Channel, Connection } from 'amqplib';
import { v4 as uuid } from 'uuid';
import { IRpcClient } from './IRpcClient';

export class RpcClient implements IRpcClient {
    private _connection: Connection;
    private _channel: Channel;

    private readonly _promiseResolveByCorrId = new Map<string, any>();

    private readonly _exchangeName: string;
    private _replyQueueName: string;

    constructor(exchangeName: string) {
        this._exchangeName = exchangeName;
    }

    public async sendCommand(route: string, data: any) {
        let id = uuid();
        let dataBytes = Buffer.from(JSON.stringify(data));

        let resolveFunc = null;
        let promise = new Promise<any>((resolve, reject) => {
            resolveFunc = resolve;
        });

        this._promiseResolveByCorrId.set(id, resolveFunc);

        this._channel.publish(this._exchangeName, route, dataBytes, {
            correlationId: id,
            replyTo: this._replyQueueName,
            persistent: true
        });

        return promise;
    }

    public async start(connection: Connection) {
        this._connection = connection;
        this._channel = await this._connection.createChannel();

        await this._channel.assertExchange(this._exchangeName, "direct", { durable: false });

        let replyToQueue = await this._channel.assertQueue("", { exclusive: true });
        this._replyQueueName = replyToQueue.queue;

        this._channel.consume(this._replyQueueName, msg => {
            let resolveFunc = this._promiseResolveByCorrId.get(msg.properties.correlationId)

            if (resolveFunc) {
                this._promiseResolveByCorrId.delete(msg.properties.correlationId);
                resolveFunc(JSON.parse(msg.content.toString()));
            }
        }, { noAck: true });
    }
}