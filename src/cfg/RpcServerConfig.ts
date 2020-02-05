import { RpcEndpoint } from "./RpcEndpoint";

export class RpcServerConfig {
    private readonly _endpoints: RpcEndpoint[] = [];
    private _rpcServerQueueName: string;

    public get endpoints() : RpcEndpoint[] {
        let result = [].concat(this._endpoints);
        return result;
    }

    public set rpcServerQueueName(value: string) {
        this._rpcServerQueueName = value;
    }

    public get rpcServerQueueName() {
        return this._rpcServerQueueName;
    }

    public setupRpcEndpoint(route: string, handler: (input: any) => any) : void {
        this._endpoints.push(new RpcEndpoint(route, handler));
    }
}