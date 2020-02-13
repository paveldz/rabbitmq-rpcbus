import { RpcClientConfig } from "./RpcClientConfig";
import { RpcServerConfig } from "./RpcServerConfig";

export class BusConfig {
    readonly rpcServer: RpcServerConfig = new RpcServerConfig();
    readonly rpcClient: RpcClientConfig = new RpcClientConfig();
}