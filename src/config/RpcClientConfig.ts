export class RpcClientConfig {
    private _timeoutMs: number = 1000;

    set timeout(value: number) {
        if (value < 1) {
            throw { invalid_timeout: true, value };
        }
        this._timeoutMs = value;
    }

    get timeout(): number {
        return this._timeoutMs;
    }
}
