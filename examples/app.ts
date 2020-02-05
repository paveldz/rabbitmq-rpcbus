import * as readline from 'readline';
import { Bus } from '../src/Bus';

let connStr = "amqp://localhost";
let exchangeName = "AsyncMessagingConsole_Rpc";

const run = async () => {
    let bus = await Bus.create(connStr, exchangeName, config => {
        config.setupEndpoint("getResponse", command => {
            console.log(command);
            return { success: true };
        });

        config.setupEndpoint("sayHello", command => {
            console.log(command);
            return { result: "hello back" };
        });
    })

    let result = await bus.rpcClient.sendCommand("getResponse", { message: "I'd like to get a response" });
    console.log(result);

    let result2 = await bus.rpcClient.sendCommand("sayHello", { message: "Hello!" });
    console.log(result2);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Press any key to stop the app. ', (answer) => {
        console.log(`App closed. Key presed: ${answer}`);
        rl.close();
    });
};
run();