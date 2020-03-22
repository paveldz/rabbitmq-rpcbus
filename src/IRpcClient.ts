export interface IRpcClient {
    sendCommand(name: string, data: any): Promise<any>;
}
