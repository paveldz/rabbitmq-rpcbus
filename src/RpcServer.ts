export class RpcServer {
    private readonly _queueName: string;
    private readonly _exchangeName: string;
    private readonly _connection: any;

    constructor(queueName: string, exchangeName: string, connection: any) {
        this._queueName = queueName;
        this._exchangeName = exchangeName;
        this._connection = connection;
    }

    async endpoint(commandName: string, handler: (input: any) => any) {

        let channel = await this._connection.createChannel();
        await this.setupEndpoint(commandName, channel);

        channel.consume(this._queueName, msg => {
            let inputObj = JSON.parse(msg.content.toString());
            let result = handler(inputObj);

            let resultBytes = Buffer.from(JSON.stringify(result));

            channel.sendToQueue(msg.properties.replyTo, resultBytes, {
                 correlationId: msg.properties.correlationId 
            });

            channel.ack(msg);
        });
    }

    private async setupEndpoint(commandName: string, channel: any) {
        await channel.assertExchange(this._exchangeName, "direct", { durable: false });

        await channel.assertQueue(this._queueName, {
            durable: true,
            exclusive: false,
            autoDelete: false
        });

        await channel.bindQueue(this._queueName, this._exchangeName, commandName);
    }
}