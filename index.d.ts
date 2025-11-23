declare module 'sap-rfc-node-net' {
    export interface SapRfcConfig {
        host: string;
        client: string;
        sysNr: string;
        user: string;
        password: string;
        lang?: string;
        poolSize?: number;
        PeakConnectionLimit?: number;
        connectionIdleTimeout?: number;
    }

    export interface ConnectionInfo {
        connected: boolean;
        systemId: string;
        client: string;
        release: string;
    }

    export interface PingResponse {
        alive: boolean;
    }

    export interface InvokeFunctionParams {
        functionName: string;
        importParams?: Record<string, any>;
        importStructures?: Record<string, Record<string, any>>;
        importTables?: Record<string, Array<Record<string, any>>>;
        exportParams?: string[];
        tables?: string[];
        structures?: string[];
        endContext?: boolean;
    }

    export interface InvokeFunctionResponse {
        exports?: Record<string, string>;
        structures?: Record<string, Record<string, string>>;
        tables?: Record<string, Array<Record<string, string>>>;
    }

    export interface CheckDllsResponse {
        dlls_found: boolean;
        message: string;
    }

    export class SapRfcClient {
        constructor(config: SapRfcConfig);
        
        connect(): Promise<ConnectionInfo>;
        ping(): Promise<PingResponse>;
        sync(): Promise<{ sync: boolean; message: string }>;
        checkDlls(): Promise<CheckDllsResponse>;
        invoke(functionName: string, params?: Record<string, any>): Promise<Record<string, string>>;
        invokeFunction(params: InvokeFunctionParams): Promise<InvokeFunctionResponse>;
        close(): Promise<void>;
    }

    export default SapRfcClient;
}

