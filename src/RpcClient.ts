import { Channel, Connection } from 'amqplib';
import { v4 as uuid } from 'uuid';
import { RpcClientConfig } from './config/RpcClientConfig';
import { IRpcClient } from './IRpcClient';
import { TimeoutError } from './TimeoutError';

export class RpcClient implements IRpcClient {
    private _connection: Connection | undefined;
    private _channel: Channel | undefined;

    private readonly _promiseManagerByCorrId = new Map<string, IPromiseManager>();

    private readonly _exchangeName: string;
    private _replyQueueName: string | undefined;

    private readonly _config: RpcClientConfig;

    constructor(exchangeName: string, config: RpcClientConfig) {
        this._exchangeName = exchangeName;
        this._config = config;
    }

    async sendCommand(route: string, data: any) {
        if (!this._channel) throw { no_chanel: true };

        let id = uuid();
        let dataBytes = Buffer.from(JSON.stringify(data));

        let timeout = setTimeout(() => this.cancelRequest(id), this._config.timeout);

        let promiseManager: IPromiseManager | null = null;
        let promise = new Promise<any>((resolve, reject) => {
            promiseManager = {
                resolve,
                reject,
                timeout,
            };
        });

        this._promiseManagerByCorrId.set(id, (promiseManager as unknown) as IPromiseManager);

        this._channel.publish(this._exchangeName, route, dataBytes, {
            correlationId: id,
            replyTo: this._replyQueueName,
            persistent: true,
        });

        return promise;
    }

    async start(connection: Connection) {
        this._connection = connection;
        this._channel = await this._connection.createChannel();

        await this._channel.assertExchange(this._exchangeName, 'direct', { durable: false });

        let replyToQueue = await this._channel.assertQueue('', { exclusive: true });
        this._replyQueueName = replyToQueue.queue;

        this._channel.consume(
            this._replyQueueName,
            msg => {
                if (!msg) return;

                let promiseManager = this._promiseManagerByCorrId.get(msg.properties.correlationId);

                if (promiseManager) {
                    this._promiseManagerByCorrId.delete(msg.properties.correlationId);

                    clearTimeout(promiseManager.timeout);
                    promiseManager.resolve(JSON.parse(msg.content.toString()));
                }
            },
            { noAck: true },
        );
    }

    private cancelRequest(correlationId: string): void {
        let promiseManager = this._promiseManagerByCorrId.get(correlationId);

        if (promiseManager) {
            this._promiseManagerByCorrId.delete(correlationId);
            promiseManager.reject(
                new TimeoutError(
                    `The request has been cancelled due to timeout: ${this._config.timeout}ms`,
                ),
            );
        }
    }
}

interface IPromiseManager {
    readonly resolve: (value?: any) => void;
    readonly reject: (reason?: any) => void;
    readonly timeout: NodeJS.Timeout;
}
