export class RpcEndpoint {
    private readonly _route: string;
    private readonly _handler: (input: any) => any;

    constructor(route: string, handler: (input: any) => any) {
        this._route = route;
        this._handler = handler;
    }

    get route(): string {
        return this._route;
    }

    get handler() {
        return this._handler;
    }
}
