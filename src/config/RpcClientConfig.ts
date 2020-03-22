export class RpcClientConfig {
    private _timeoutMs?: number | undefined;

    set timeout(value: number | undefined) {
        this._timeoutMs = value;
    }

    get timeout(): number | undefined {
        return this._timeoutMs;
    }
}
