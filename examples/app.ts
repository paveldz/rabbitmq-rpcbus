import * as readline from 'readline';

import { Bus } from '../src/Bus';

var connStr = "amqp://localhost";
var exchangeName = "AsyncMessagingConsole_Rpc";

const run = async () => {
    var bus = new Bus(connStr, exchangeName);
    await bus.connect();

    var rpcServer = bus.createRpcServer("AsyncMessagingConsole_RpcQueue");
        
    await rpcServer.endpoint( "getResponse", command => {
        console.log(command);
        return true;
    });

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