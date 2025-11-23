const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SapRfcClient {
    constructor(config) {
        this.config = config;
        this.connected = false;
        this.bridgePath = path.join(__dirname, 'lib', 'bin', 'SapRfcBridge.exe');
        
        if (!fs.existsSync(this.bridgePath)) {
            throw new Error(
                'SAP RFC Bridge not found. Please build the library first:\n' +
                'npm run build'
            );
        }
    }

    async _exec(cmd, data = {}) {
        return new Promise((resolve, reject) => {
            const json = JSON.stringify(data);
            const proc = spawn(this.bridgePath, [cmd, json], {
                cwd: path.join(__dirname, 'lib', 'bin')
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (d) => stdout += d.toString());
            proc.stderr.on('data', (d) => stderr += d.toString());

            proc.on('close', () => {
                if (stderr && !stdout) return reject(new Error(stderr));
                
                try {
                    const lines = stdout.trim().split('\n');
                    const jsonLine = lines.find(l => l.startsWith('{'));
                    if (!jsonLine) return reject(new Error(`Invalid response: ${stdout}`));
                    
                    const res = JSON.parse(jsonLine);
                    if (res.success) resolve(res.data);
                    else reject(new Error(res.error));
                } catch (err) {
                    reject(new Error(`Parse error: ${err.message}\nOutput: ${stdout}`));
                }
            });

            proc.on('error', reject);
        });
    }

    async connect() {
        const data = await this._exec('connect', {
            host: this.config.host,
            client: this.config.client,
            sysNr: this.config.sysNr,
            user: this.config.user,
            password: this.config.password,
            lang: this.config.lang || 'EN',
            poolSize: this.config.poolSize?.toString() || '5'
        });
        
        this.connected = true;
        return data;
    }

    async ping() {
        if (!this.connected) throw new Error('Not connected. Call connect() first.');
        return await this._exec('ping');
    }

    async sync() {
        // No connection required - just tests Node.js <-> .NET communication
        return await this._exec('sync');
    }

    async checkDlls() {
        // Check if SAP NCo DLLs are present
        return await this._exec('checkdlls');
    }

    async invoke(functionName, params = {}) {
        if (!this.connected) throw new Error('Not connected. Call connect() first.');
        return await this._exec('invoke', { function: functionName, params });
    }

    async invokeFunction({ 
        functionName, 
        importParams = {}, 
        exportParams = [], 
        tables = [], 
        structures = [],
        endContext = false 
    }) {
        if (!this.connected) throw new Error('Not connected. Call connect() first.');
        
        if (!functionName) {
            throw new Error('functionName is required');
        }

        return await this._exec('invokecomplex', {
            function: functionName,
            importParams,
            exportParams,
            tables,
            structures,
            endContext
        });
    }

    async close() {
        if (!this.connected) return;
        await this._exec('close');
        this.connected = false;
    }
}

module.exports = SapRfcClient;
module.exports.SapRfcClient = SapRfcClient;
module.exports.default = SapRfcClient;

