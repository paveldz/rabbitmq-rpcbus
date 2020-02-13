import { RpcEndpoint } from "./RpcEndpoint";

export class RpcServerConfig {
    private readonly _endpoints: RpcEndpoint[] = [];
    private _queueName: string;

    public get endpoints() : RpcEndpoint[] {
        let result = [].concat(this._endpoints);
        return result;
    }

    public set queueName(value: string) {
        this._queueName = value;
    }

    public get queueName() {
        return this._queueName;
    }

    public addEndpoint(route: string, handler: (input: any) => any) : void {
        this._endpoints.push(new RpcEndpoint(route, handler));
    }
}