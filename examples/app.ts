import * as readline from 'readline';
import { Bus } from '../src/Bus';

let connStr = "amqp://localhost";
let exchangeName = "AsyncMessagingConsole_Rpc";
let rpcServerQueueName = "AsyncMessagingConsole_RpcQueue";

const run = async () => {

    let bus = await Bus.create(connStr, exchangeName, rpcConfig => {
        rpcConfig.rpcServerQueueName = rpcServerQueueName;

        rpcConfig.setupRpcEndpoint("service/sayHello", command => {
            console.log(`Received message: ${JSON.stringify(command)}`);
            return { response: "Hi! Nice to see you!" };
        });

        rpcConfig.setupRpcEndpoint("service/sayBye", command => {
            console.log(`Received message: ${JSON.stringify(command)}`);
            return { response: "Bye! See you later!" };
        });
    })

    let response0 = await bus.rpcClient.sendCommand("service/sayHello", { message: "Hello! (the first time)" });
    console.log(`Received response: ${JSON.stringify(response0)}\n`);

    let response1 = await bus.rpcClient.sendCommand("service/sayHello", { message: "Hi! (the second time)" });
    console.log(`Received response: ${JSON.stringify(response1)}\n`);

    let response2 = await bus.rpcClient.sendCommand("service/sayBye", { message: "Bye!" });
    console.log(`Received response: ${JSON.stringify(response2)}\n`);

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