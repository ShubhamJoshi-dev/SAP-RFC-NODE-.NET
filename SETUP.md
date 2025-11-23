# Setup Guide - sap-rfc-node-net

## Installation Steps

### 1. Install the Package

```bash
npm install sap-rfc-node-net
```

### 2. Obtain SAP .NET Connector (NCo) DLLs

You need to download SAP .NET Connector 3.0 from SAP:

**Download Location:**
- SAP Support Portal: https://support.sap.com/nco
- You need a valid SAP S-User account
- Search for "SAP Connector for Microsoft .NET"

**Required Files:**
- `sapnco.dll` (~556 KB)
- `sapnco_utils.dll` (~6.6 MB)

### 3. Copy SAP NCo DLLs

Copy the two DLL files to the package's `lib/bin/` folder (same folder as the .exe):

```bash
# Windows CMD
copy sapnco.dll node_modules\sap-rfc-node-net\lib\bin\
copy sapnco_utils.dll node_modules\sap-rfc-node-net\lib\bin\

# Windows PowerShell
Copy-Item sapnco.dll node_modules\sap-rfc-node-net\lib\bin\
Copy-Item sapnco_utils.dll node_modules\sap-rfc-node-net\lib\bin\
```

Folder structure:
```
node_modules/
└── sap-rfc-node-net/
    └── lib/
        └── bin/
            ├── SapRfcBridge.exe     # Included
            ├── sapnco.dll          # Copy here
            └── sapnco_utils.dll    # Copy here
```

### 5. Verify Installation

The package includes a pre-built bridge executable, so no build step is required!

```bash
node node_modules/sap-rfc-node-net/examples/basic.js
```

Or create a test file:

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
        await client.connect();
        console.log('✅ Connected to SAP!');
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

test();
```

---

## Advanced Setup

### Custom DLL Location

If you want to store the SAP NCo DLLs in a different location:

**Option 1: Environment Variable**

Set `SAP_NCO_PATH` before building:

```bash
# Windows PowerShell
$env:SAP_NCO_PATH = "C:\SAP\NCo"
cd node_modules\sap-rfc-node-net
npm run build

# Windows CMD
set SAP_NCO_PATH=C:\SAP\NCo
cd node_modules\sap-rfc-node-net
npm run build
```

**Option 2: Manual Copy**

After building, manually copy the DLLs:

```bash
cd node_modules/sap-rfc-node-net
npm run build
copy C:\path\to\sapnco.dll lib\bin\
copy C:\path\to\sapnco_utils.dll lib\bin\
```

### Automated Setup Script

Create a `postinstall` script in your `package.json`:

```json
{
  "scripts": {
    "postinstall": "node setup-sap.js"
  }
}
```

**setup-sap.js:**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up SAP RFC Node.js connector...');

// Check if external folder exists
const externalPath = path.join(__dirname, 'external');
if (!fs.existsSync(externalPath)) {
    console.log('⚠️  External folder not found. Creating...');
    fs.mkdirSync(externalPath);
}

// Check for SAP NCo DLLs
const sapncoDll = path.join(externalPath, 'sapnco.dll');
const sapncoUtilsDll = path.join(externalPath, 'sapnco_utils.dll');

if (!fs.existsSync(sapncoDll) || !fs.existsSync(sapncoUtilsDll)) {
    console.log('\n⚠️  SAP .NET Connector DLLs not found!');
    console.log('\nPlease download SAP NCo 3.0 from:');
    console.log('https://support.sap.com/nco');
    console.log('\nThen copy the following files to:', externalPath);
    console.log('  - sapnco.dll');
    console.log('  - sapnco_utils.dll');
    console.log('\nAfter copying, run: npm run build-sap');
    process.exit(0);
}

// Build the .NET bridge
console.log('Building SAP RFC bridge...');
const sapPackagePath = path.join(__dirname, 'node_modules', 'sap-rfc-node-net');

if (fs.existsSync(sapPackagePath)) {
    try {
        execSync('npm run build', { cwd: sapPackagePath, stdio: 'inherit' });
        console.log('✅ SAP RFC bridge built successfully!');
    } catch (error) {
        console.error('❌ Failed to build SAP RFC bridge');
        process.exit(1);
    }
} else {
    console.log('SAP RFC package found, ready to use');
}
```

---

## Troubleshooting

### "SAP RFC Bridge not found"

**Solution:** Run the build command:
```bash
cd node_modules/sap-rfc-node-net
npm run build
```

### "sapnco.dll not found" during build

**Cause:** DLL files not in `external` folder

**Solution:**
1. Download SAP NCo 3.0 from SAP Support Portal
2. Copy `sapnco.dll` and `sapnco_utils.dll` to `external/` folder
3. Run `npm run build` again

### "Cannot load sapnco.dll" at runtime

**Cause:** DLLs not copied to `lib/bin/` folder

**Solution:**
```bash
cd node_modules/sap-rfc-node-net
copy ..\..\external\sapnco.dll lib\bin\
copy ..\..\external\sapnco_utils.dll lib\bin\
```

### Build fails: "dotnet command not found"

**Cause:** .NET SDK not installed

**Solution:** Install .NET SDK 6.0 or later from:
https://dotnet.microsoft.com/download

Or use .NET Framework 4.8 (pre-installed on Windows 10/11)

---

## Deployment

### For Production

**Option 1: Include DLLs in Repository** (Recommended)

```
your-project/
├── external/
│   ├── sapnco.dll
│   └── sapnco_utils.dll
├── node_modules/
└── package.json
```

Add to `.gitignore` if needed:
```gitignore
# Ignore but keep structure
!external/.gitkeep
```

**Option 2: Environment-Specific**

Different environments can have different DLL versions:
- Development: Local `external/` folder
- Production: Shared network path via `SAP_NCO_PATH`

### Docker

**Dockerfile:**
```dockerfile
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8

WORKDIR /app
COPY package*.json ./
COPY external/ ./external/

RUN npm install
RUN cd node_modules/sap-rfc-node-net && npm run build

COPY . .
CMD ["node", "index.js"]
```

---

## Why External DLLs?

1. **License Compliance** - SAP NCo requires a valid SAP license
2. **Size** - DLLs are ~13 MB, keeping package size small
3. **Version Control** - Users can use their specific NCo version
4. **Security** - Proprietary SAP software not distributed publicly

---

## Summary

1. Install package: `npm install sap-rfc-node-net`
2. Create `external/` folder in project root
3. Download SAP NCo 3.0 from SAP Support Portal
4. Copy `sapnco.dll` and `sapnco_utils.dll` to `external/`
5. Build: `cd node_modules/sap-rfc-node-net && npm run build`
6. Use the package in your code

**Need Help?** See README.md for usage examples and API documentation.

