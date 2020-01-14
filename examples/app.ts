import * as readline from 'readline';

import { Bus } from '../src/Bus';

let connStr = "amqp://localhost";
let exchangeName = "AsyncMessagingConsole_Rpc";

const run = async () => {
    let bus = new Bus(connStr, exchangeName);
    await bus.connect();

    let rpcServer = bus.createRpcServer("AsyncMessagingConsole_RpcQueue");
        
    await rpcServer.endpoint( "getResponse", command => {
        console.log(command);
        return { success: true };
    });

    let rpcClient = await bus.createRpcClient(); 
    let result = await rpcClient.sendCommand("getResponse", { message: "hello" });
    console.log(result);

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