export class RpcServer {
    private readonly _queueName: string;
    private readonly _exchangeName: string;
    private readonly _connection: any;

    constructor(queueName: string, exchangeName: string, connection: any) {
        this._queueName = queueName;
        this._exchangeName = exchangeName;
        this._connection = connection;
    }

    async endpoint(methodName: string, handler: (input: any) => any) {

        var channel = await this._connection.createChannel();
        await this.setupEndpoint(methodName, channel);

        channel.consume(this._queueName, msg => {
            console.log(msg.content.toString());

            var inputObj = JSON.parse(msg.content.toString());
            var result = handler(inputObj);

            channel.ack(msg);
        });
    }

    private async setupEndpoint(methodName: string, channel: any) {
        await channel.assertExchange(this._exchangeName, "direct", { durable: false });

        await channel.assertQueue(this._queueName, {
            durable: true,
            exclusive: false,
            autoDelete: false
        });

        await channel.bindQueue(this._queueName, this._exchangeName, methodName);
    }
}