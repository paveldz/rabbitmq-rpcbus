import * as readline from 'readline';
import { Bus } from '../src/Bus';

let connStr = "amqp://localhost";
let exchangeName = "AsyncMessagingConsole_Rpc";
let rpcServerQueueName = "AsyncMessagingConsole_RpcQueue";

const run = async () => {

    let bus = await Bus.create(connStr, exchangeName, rpcConfig => {
        rpcConfig.rpcServerQueueName = rpcServerQueueName;

        rpcConfig.setupRpcEndpoint("getResponse", command => {
            console.log(command);
            return { success: true };
        });

        rpcConfig.setupRpcEndpoint("sayHello", command => {
            console.log(command);
            return { result: "hello back" };
        });
    })

    let result = await bus.rpcClient.sendCommand("getResponse", { message: "Hello1. I'd like to get a response" });
    console.log(result);

    let result2 = await bus.rpcClient.sendCommand("sayHello", { message: "Hello2" });
    console.log(result2);

    let result3 = await bus.rpcClient.sendCommand("sayHello", { message: "Hello3" });
    console.log(result3);

    let result4 = await bus.rpcClient.sendCommand("sayHello", { message: "Hello4" });
    console.log(result4);

    setTimeout(async () => {
        let result5 = await bus.rpcClient.sendCommand("sayHello", { message: "Hellosdsdsdsdsd!" });
        console.log(result5);
    }, 10000);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Press any key to stop the app. \n', (answer) => {
        console.log(`App closed. Key presed: ${answer}`);
        rl.close();
    });
};
run();