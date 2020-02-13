export class RpcClientConfig {
    private _timeoutMs?: number;

    public set timeout(value: number) {
        this._timeoutMs = value;
    }

    public get timeout(): number {
        return this._timeoutMs;
    }
}