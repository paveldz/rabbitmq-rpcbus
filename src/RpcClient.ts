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

    private readonly DEFAULT_REQUEST_TIMEOUT: number = 1 * 60 * 1000; // min * sec * msec
    private readonly _requestTimeout: number;

    constructor(exchangeName: string, config: RpcClientConfig) {
        this._exchangeName = exchangeName;
        this._requestTimeout = config.timeout || this.DEFAULT_REQUEST_TIMEOUT;
    }

    async sendCommand(route: string, data: any) {
        if (!this._channel) return Promise.reject({ no_chanel: true });

        let id = uuid();
        let dataBytes = Buffer.from(JSON.stringify(data));

        let timeout = setTimeout(() => this.cancelRequest(id), this._requestTimeout);

        let promiseManager: IPromiseManager | null = null;
        let promise = new Promise<any>((resolve, reject) => {
            promiseManager = {
                resolve,
                reject,
                timeout,
            };
        });

        // TODO: check this out
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
                // TODO: check this out
                if (!msg) throw { no_msg: true };

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
                    `The request has been cancelled due to timeout: ${this._requestTimeout}ms`,
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
