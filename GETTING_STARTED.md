# Getting Started with sap-rfc-dotnet

## 📦 Installation

### Option 1: From npm (after publishing)

```bash
npm install sap-rfc-dotnet
```

### Option 2: From source (current)

```bash
# Clone or copy the package
cd sap-rfc-dotnet

# Build the .NET bridge
npm run build

# Test
node test-package.js
```

## 🚀 Quick Start

### 1. Create a new Node.js project

```bash
mkdir my-sap-app
cd my-sap-app
npm init -y
npm install sap-rfc-dotnet
```

### 2. Create your first SAP connection

Create `app.js`:

```javascript
const SapRfcClient = require('sap-rfc-dotnet');

const client = new SapRfcClient({
    host: '192.168.1.100',
    client: '400',
    sysNr: '00',
    user: 'YOUR_USER',
    password: 'YOUR_PASSWORD',
    lang: 'EN'
});

async function main() {
    try {
        // Connect
        const info = await client.connect();
        console.log('Connected to SAP:', info.systemId);
        
        // Call RFC
        const result = await client.invoke('STFC_CONNECTION', {
            REQUTEXT: 'Hello SAP!'
        });
        
        console.log('Response:', result.ECHOTEXT);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

main();
```

### 3. Run your app

```bash
node app.js
```

## 💡 Examples

### Basic Connection

```javascript
const SapRfcClient = require('sap-rfc-dotnet');

const client = new SapRfcClient({
    host: 'sap.company.com',
    client: '400',
    sysNr: '00',
    user: 'SAPUSER',
    password: 'PASSWORD'
});

await client.connect();
await client.ping();
await client.close();
```

### Execute RFC Function

```javascript
const result = await client.invoke('RFC_READ_TABLE', {
    QUERY_TABLE: 'T000',
    DELIMITER: '|',
    ROWCOUNT: 10
});

console.log(result);
```

### With Environment Variables (Recommended)

```javascript
require('dotenv').config(); // npm install dotenv

const client = new SapRfcClient({
    host: process.env.SAP_HOST,
    client: process.env.SAP_CLIENT,
    sysNr: process.env.SAP_SYSNR,
    user: process.env.SAP_USER,
    password: process.env.SAP_PASSWORD
});
```

Create `.env` file:
```
SAP_HOST=192.168.1.100
SAP_CLIENT=400
SAP_SYSNR=00
SAP_USER=SAPUSER
SAP_PASSWORD=SecurePassword123
```

### Error Handling

```javascript
try {
    await client.connect();
    const result = await client.invoke('MY_RFC', {});
} catch (error) {
    if (error.message.includes('not found')) {
        console.error('RFC function does not exist');
    } else if (error.message.includes('LOGON_FAILURE')) {
        console.error('Invalid credentials');
    } else {
        console.error('Error:', error.message);
    }
} finally {
    await client.close();
}
```

## 🔧 Configuration

### Connection Parameters

```javascript
{
    host: string;        // SAP application server (required)
    client: string;      // SAP client number (required)
    sysNr: string;       // System number (required)
    user: string;        // Username (required)
    password: string;    // Password (required)
    lang?: string;       // Language code (default: 'EN')
    poolSize?: number;   // Connection pool size (default: 5)
}
```

### Supported RFC Functions

All standard SAP RFC functions are supported:
- `RFC_PING` - Test connection
- `STFC_CONNECTION` - Test with echo
- `RFC_READ_TABLE` - Read SAP tables
- `BAPI_*` - Business APIs
- Custom Z/Y functions

## 📚 More Examples

Check the `examples/` folder:
- `basic.js` - Basic connection and RFC call
- `custom-rfc.js` - Execute custom RFCs
- `error-handling.js` - Proper error handling

## 🐛 Troubleshooting

### "SAP RFC Bridge not found"

Build the package:
```bash
npm run build
```

### Connection timeout

Check:
- SAP server is running and reachable
- Firewall allows SAP ports (3200-3299)
- Credentials are correct
- Network connectivity

### "Function module not found"

Verify:
- RFC function exists in SAP
- User has authorization to execute it
- Function name is spelled correctly (case-sensitive)

## 📖 Next Steps

1. Read the full [README.md](README.md)
2. Check [examples/](examples/) folder
3. Review [API documentation](README.md#-api-reference)
4. Learn about [publishing to npm](PUBLISH.md)

## 🤝 Need Help?

- Check the [README](README.md)
- Review [examples](examples/)
- Open an issue on GitHub

Happy coding with SAP! 🚀

