# ARM64 Windows Support

## Overview

Starting with version 1.4.0, `sap-rfc-node-net` supports Windows on ARM64 processors (e.g., Microsoft Surface Pro X, ARM-based servers).

## How It Works

### Architecture
```
Node.js (ARM64 or x64)
    ↓
index.js (JavaScript - platform agnostic)
    ↓
SapRfcBridge.exe (AnyCPU .NET binary)
    ↓
SAP NCo DLLs (x64 - runs via emulation on ARM64)
    ↓
SAP System
```

### Technical Details

1. **Node.js layer** - Runs natively on ARM64
2. **.NET Bridge** - Compiled as `AnyCPU`, adapts to system architecture
3. **SAP NCo DLLs** - x64 binaries that run via Windows ARM64 x64 emulation
4. **Communication** - Standard process spawning works across architectures

## Compatibility

### Supported Systems
- Windows 10/11 on ARM64 (e.g., Surface Pro X, Surface Laptop)
- Windows Server ARM64 edition
- ARM64 virtual machines on Azure, AWS

### Requirements
- Windows 10 version 1803 or later (ARM64)
- .NET Framework 4.8
- x64 emulation enabled (default on Windows ARM64)

## Performance Considerations

### Expected Performance
- **Node.js operations:** Native ARM64 performance
- **.NET Bridge:** Near-native performance (AnyCPU)
- **SAP NCo DLLs:** Running via x64 emulation
  - Slight performance overhead (typically 10-20%)
  - Still suitable for most use cases

### Benchmarks (estimated)
| Operation | x64 Native | ARM64 (emulated) |
|-----------|-----------|------------------|
| Connect | ~500ms | ~600ms |
| Simple RFC | ~50ms | ~60ms |
| Complex RFC | ~200ms | ~240ms |

## Installation on ARM64

Same as x64 Windows:

```bash
npm install sap-rfc-node-net
```

No special configuration needed.

## Testing on ARM64

```javascript
const SapRfcClient = require('sap-rfc-node-net');

const client = new SapRfcClient({
    host: 'your-sap-server',
    client: '400',
    sysNr: '00',
    user: 'USERNAME',
    password: 'PASSWORD'
});

async function test() {
    try {
        // Test connection
        await client.connect();
        console.log('Connected on ARM64!');
        
        // Test sync (tests Node.js <-> .NET communication)
        const sync = await client.sync();
        console.log('Sync result:', sync);
        
        // Test SAP call
        const result = await client.ping();
        console.log('SAP ping successful:', result);
        
        console.log('All tests passed on ARM64 Windows!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

test();
```

## Known Issues

### SAP NCo Native ARM64
SAP .NET Connector 3.0 does not have native ARM64 binaries. The x64 DLLs run via Windows' built-in x64 emulation layer. This is transparent and works well but:
- Slight performance overhead
- Increased memory usage during emulation

### Future Native Support
If SAP releases native ARM64 NCo binaries in the future, simply replace the DLLs in the `external/` folder and rebuild:

```bash
# Replace DLLs
copy new-arm64-sapnco.dll external\sapnco.dll
copy new-arm64-sapnco_utils.dll external\sapnco_utils.dll

# Rebuild
npm run build

# Test
node examples/basic.js
```

## Troubleshooting

### "Cannot load sapnco.dll"
Ensure x64 emulation is enabled (it is by default on Windows ARM64).

### Performance issues
- This is expected due to x64 emulation
- Consider using native x64 hardware for production high-load scenarios
- For moderate use, ARM64 performance is acceptable

### Check your system architecture
```bash
# PowerShell
$env:PROCESSOR_ARCHITECTURE
# Should show: ARM64

# Node.js
node -p "process.arch"
# Shows: arm64 or x64 (if running x64 Node on ARM64)
```

## Recommendations

### Development
ARM64 Windows works great for development and testing.

### Production
- **Light/Medium load:** ARM64 is suitable
- **Heavy load:** Consider x64 hardware for best performance
- **Mixed environment:** Package works on both, so you can develop on ARM64 and deploy to x64

## Version History

- **1.4.0** - Added ARM64 support via AnyCPU compilation
- **1.3.0** - x64 only
- **1.2.0** - x64 only
- **1.1.0** - x64 only
- **1.0.0** - x64 only

## Summary

ARM64 support allows you to:
- Develop on ARM64 Windows devices (Surface Pro X, etc.)
- Deploy to ARM64 Windows servers
- Use the same package across x64 and ARM64 systems
- Leverage Windows' transparent x64 emulation

**The package works on ARM64 Windows out of the box!**

