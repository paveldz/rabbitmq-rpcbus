# rabbitmq-rpcbus
A higher-level node.js library for RPC over RabbitMQ.

## Examples
### Server (endpoints configuration):
```javascript
const connStr = "amqp://localhost";
const exchangeName = "AsyncMessagingConsole_Rpc";
const rpcServerQueueName = "AsyncMessagingConsole_RpcQueue";

const bus = await Bus.create(connStr, exchangeName, rpcConfig => {
    rpcConfig.rpcServerQueueName = rpcServerQueueName;

    rpcConfig.setupRpcEndpoint("service/sayHello", command => {
        console.log(`Received message: ${JSON.stringify(command)}`);
        return { response: "Hi! Nice to see you!" };
    });

    rpcConfig.setupRpcEndpoint("service/sayBye", command => {
        console.log(`Received message: ${JSON.stringify(command)}`);
        return { response: "Bye! See you later!" };
    });
});
```

### Client:
```javascript
const connStr = "amqp://localhost";
const exchangeName = "AsyncMessagingConsole_Rpc";

const bus = await Bus.create(connStr, exchangeName);

let response0 = await bus.rpcClient.sendCommand("service/sayHello", { message: "Hello! (the first time)" });
console.log(`Received response: ${JSON.stringify(response0)}\n`);

let response1 = await bus.rpcClient.sendCommand("service/sayHello", { message: "Hi! (the second time)" });
console.log(`Received response: ${JSON.stringify(response1)}\n`);

let response2 = await bus.rpcClient.sendCommand("service/sayBye", { message: "Bye!" });
console.log(`Received response: ${JSON.stringify(response2)}\n`);
```
