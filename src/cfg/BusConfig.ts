import { RpcEndpoint } from "./RpcEndpoint";

export class BusConfig {
    private readonly _endpoints = new Map<string, (input: any) => any>();

    public get endpoints() : RpcEndpoint[] {
        let result: RpcEndpoint[] = [];
        this._endpoints.forEach((func, key) => result.push(new RpcEndpoint(key, func)));
        
        return result;
    }

    public setupEndpoint(route: string, handler: (input: any) => any) : void {
        this._endpoints.set(route, handler);
    }
}