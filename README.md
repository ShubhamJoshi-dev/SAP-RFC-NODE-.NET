# SAP RFC Node.js .NET Bridge

Node.js package for SAP Remote Function Call (RFC) integration using SAP .NET Connector (NCo) 3.0.

## Overview

This package bridges Node.js applications with SAP systems through the official SAP .NET Connector. It handles the complexity of .NET interop while providing a straightforward JavaScript API.

## Requirements

- Windows (x64 or ARM64)
- .NET Framework 4.8 or higher
- SAP NetWeaver RFC Library (sapnco.dll and sapnco_utils.dll)
- Node.js 14 or higher

## Installation

```bash
npm install sap-rfc-node-net
```

After installation, you must manually add the SAP NCo DLLs:

1. Download SAP .NET Connector 3.0 from SAP Support Portal
2. Copy `sapnco.dll` and `sapnco_utils.dll` to:
   ```
   node_modules/sap-rfc-node-net/lib/bin/
   ```

See SETUP.md for detailed instructions.

## Quick Start

```javascript
const SapRfcClient = require('sap-rfc-node-net');

const client = new SapRfcClient({
    host: '192.168.1.100',
    client: '400',
    sysNr: '00',
    user: 'USERNAME',
    password: 'PASSWORD',
    lang: 'EN'
});

async function main() {
    await client.connect();
    
    const result = await client.invoke('RFC_PING');
    console.log(result);
    
    await client.close();
}

main();
```

## Configuration Options

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| host | Yes | - | SAP application server hostname or IP |
| client | Yes | - | SAP client number |
| sysNr | Yes | - | SAP system number |
| user | Yes | - | SAP username |
| password | Yes | - | SAP password |
| lang | No | EN | Logon language |
| poolSize | No | 5 | Connection pool size |
| PeakConnectionLimit | No | 10 | Maximum concurrent connections |
| connectionIdleTimeout | No | 600 | Idle timeout in seconds |

## API Reference

### Methods

#### connect()

Establishes connection to SAP system.

```javascript
await client.connect();
```

#### checkDlls()

Verifies that required SAP NCo DLLs are installed.

```javascript
await client.checkDlls();
```

#### ping()

Tests the active SAP connection.

```javascript
await client.ping();
```

#### invoke(functionName, params)

Executes an RFC function with simple parameters.

```javascript
const result = await client.invoke('STFC_CONNECTION', {
    REQUTEXT: 'Hello SAP'
});
```

#### invokeFunction(options)

Executes an RFC function with complex parameters including structures and tables.

```javascript
const result = await client.invokeFunction({
    functionName: 'BAPI_VENDOR_FIND',
    importParams: {
        SEARCHTERM: '0000100*'
    },
    tables: ['VENDOR_LIST'],
    exportParams: ['RETURN']
});
```

#### close()

Closes the SAP connection.

```javascript
await client.close();
```

## Working with Tables and Structures

### Reading Tables

```javascript
const result = await client.invokeFunction({
    functionName: 'BAPI_VENDOR_GETLIST',
    importParams: {
        MAXROWS: 100
    },
    tables: ['ADDRESSDATA', 'VENDORLIST']
});

console.log(result.tables.VENDORLIST);
```

### Writing Tables

```javascript
const result = await client.invokeFunction({
    functionName: 'BAPI_VENDOR_UPDATE',
    importParams: {
        VENDOR: '0000100000'
    },
    importStructures: {
        ADDRESS: {
            NAME: 'Vendor Name',
            CITY: 'New York',
            COUNTRY: 'US'
        }
    },
    importTables: {
        BANKDATA: [
            {
                BANK_CTRY: 'US',
                BANK_KEY: '123456789',
                BANK_ACCT: '9876543210'
            }
        ]
    }
});
```

## Error Handling

```javascript
try {
    await client.connect();
    const result = await client.invoke('BAPI_VENDOR_FIND');
} catch (error) {
    if (error.message.includes('Not connected')) {
        console.error('Connection error:', error.message);
    } else {
        console.error('RFC error:', error.message);
    }
} finally {
    await client.close();
}
```

## Connection State Validation

The package validates connection state before executing RFC calls. If you attempt to execute an RFC without connecting first, you will receive a clear error message.

## Examples

See the `examples/` directory for complete working examples:

- `basic.js` - Simple RFC execution
- `generic-rfc.js` - Dynamic RFC calls with parameters
- `vendor-data.js` - Reading vendor master data
- `vendor-update.js` - Updating vendor information
- `error-handling.js` - Proper error handling patterns
- `check-setup.js` - Verify installation and setup

## Architecture

This package uses a CLI-based bridge architecture:

1. Node.js spawns a .NET executable (SapRfcBridge.exe)
2. Commands and data are exchanged via JSON over stdio
3. The .NET bridge handles all SAP NCo operations
4. Results are serialized back to Node.js as JSON

This approach provides clean separation and avoids complex native module compilation.

## Platform Support

- Windows x64: Full support
- Windows ARM64: Full support
- Linux/macOS: Not supported (requires .NET Framework and SAP NCo for Windows)

For cross-platform deployment, consider running the Windows component in a container. See DOCKER.md for guidance.

## Limitations

- Windows only (SAP NCo limitation)
- .NET Framework 4.8 required
- SAP NCo DLLs must be obtained separately from SAP
- Each RFC call spawns a new .NET process (stateless design)

## Troubleshooting

### DLL Loading Errors

If you see "Could not load file or assembly 'sapnco'":

1. Verify DLLs are in `node_modules/sap-rfc-node-net/lib/bin/`
2. Run `await client.checkDlls()` to diagnose
3. Ensure DLLs match your system architecture (x64 or ARM64)

### Connection Errors

If connection fails:

1. Verify SAP host is reachable
2. Check if VPN connection is required
3. Confirm SAP credentials are correct
4. Verify firewall allows SAP RFC port (default 33XX where XX is system number)

### Not Connected Errors

If you see "Not connected to SAP":

1. Call `await client.connect()` before executing RFCs
2. Connection is lost after `client.close()` - reconnect if needed
3. Check network stability for long-running operations

## License

MIT

## Support

For SAP .NET Connector documentation and downloads, visit SAP Support Portal.

For package issues, see the GitHub repository.
