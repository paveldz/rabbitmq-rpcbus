import { RpcEndpoint } from './RpcEndpoint';

export class RpcServerConfig {
    private readonly _endpoints: RpcEndpoint[] = [];
    private _queueName: string | undefined;

    get endpoints(): RpcEndpoint[] {
        const result = [...this._endpoints];
        return result;
    }

    setQueueName(value: string) {
        this._queueName = value;
    }

    get queueName(): string | undefined {
        return this._queueName;
    }

    addEndpoint(route: string, handler: (input: any) => any): void {
        this._endpoints.push(new RpcEndpoint(route, handler));
    }
}
