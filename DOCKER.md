# Docker Deployment Guide

## Overview

The `sap-rfc-node-net` package includes a pre-built .NET executable that requires .NET Framework 4.8 **runtime** to execute.

---

## Windows Container (Recommended)

### Dockerfile

```dockerfile
# Use Windows Server Core with .NET Framework 4.8
FROM mcr.microsoft.com/dotnet/framework/runtime:4.8-windowsservercore-ltsc2022

# Install Node.js
# Download from https://nodejs.org/dist/v18.x.x/node-v18.x.x-x64.msi
# Or use chocolatey
RUN powershell -Command \
    Set-ExecutionPolicy Bypass -Scope Process -Force; \
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; \
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1')); \
    choco install nodejs -y

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy SAP NCo DLLs to the package
COPY external/sapnco.dll ./node_modules/sap-rfc-node-net/external/
COPY external/sapnco_utils.dll ./node_modules/sap-rfc-node-net/external/

# Copy application code
COPY . .

# Expose port (if needed)
EXPOSE 3000

# Run application
CMD ["node", "index.js"]
```

### Project Structure for Docker

```
your-project/
├── Dockerfile
├── package.json
├── index.js
└── external/               # Your SAP NCo DLLs
    ├── sapnco.dll
    └── sapnco_utils.dll
```

### Build & Run

```bash
# Build image
docker build -t my-sap-app .

# Run container
docker run -d \
  -e SAP_HOST=your-sap-server \
  -e SAP_CLIENT=400 \
  -e SAP_USER=username \
  -e SAP_PASSWORD=password \
  my-sap-app
```

---

## Linux Container (Alternative - Requires Wine)

**Note:** This is more complex and not recommended for production.

### Dockerfile with Wine

```dockerfile
FROM node:18

# Install Wine to run Windows .exe on Linux
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y wine wine32 wine64 && \
    apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy SAP NCo DLLs
COPY external/*.dll ./node_modules/sap-rfc-node-net/external/

COPY . .

CMD ["node", "index.js"]
```

**Limitations:**
- Wine is not officially supported by SAP
- Performance overhead
- Potential compatibility issues
- Not recommended for production

---

## Best Practices

### 1. Multi-Stage Build

```dockerfile
# Build stage (if you have build steps)
FROM node:18-windowsservercore AS builder
WORKDIR /build
COPY package*.json ./
RUN npm install --production

# Runtime stage
FROM mcr.microsoft.com/dotnet/framework/runtime:4.8-windowsservercore-ltsc2022
WORKDIR /app

# Copy Node.js from official image
COPY --from=node:18-windowsservercore C:/Program\ Files/nodejs C:/Program\ Files/nodejs
ENV PATH="C:\Program Files\nodejs;${PATH}"

# Copy node_modules from builder
COPY --from=builder /build/node_modules ./node_modules

# Copy SAP NCo DLLs
COPY external/*.dll ./node_modules/sap-rfc-node-net/external/

# Copy app
COPY . .

CMD ["node", "index.js"]
```

### 2. Environment Variables

```dockerfile
ENV SAP_HOST=your-sap-server \
    SAP_CLIENT=400 \
    SAP_SYSNR=00 \
    SAP_USER=username \
    SAP_PASSWORD=password \
    SAP_LANG=EN
```

### 3. Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD powershell -command "try { \
    $response = Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing; \
    if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } \
  } catch { exit 1 }"
```

---

## Docker Compose

### docker-compose.yml

```yaml
version: '3.8'

services:
  sap-app:
    build: .
    environment:
      - SAP_HOST=${SAP_HOST}
      - SAP_CLIENT=${SAP_CLIENT}
      - SAP_SYSNR=${SAP_SYSNR}
      - SAP_USER=${SAP_USER}
      - SAP_PASSWORD=${SAP_PASSWORD}
    ports:
      - "3000:3000"
    volumes:
      # Optional: Mount DLLs from host
      - ./external/sapnco.dll:/app/node_modules/sap-rfc-node-net/external/sapnco.dll
      - ./external/sapnco_utils.dll:/app/node_modules/sap-rfc-node-net/external/sapnco_utils.dll
    restart: unless-stopped
```

### .env file

```env
SAP_HOST=192.168.1.100
SAP_CLIENT=400
SAP_SYSNR=00
SAP_USER=username
SAP_PASSWORD=your-secure-password
```

---

## Required Components in Docker

### What You Need

| Component | Required | Why |
|-----------|----------|-----|
| **.NET Framework 4.8 Runtime** | ✅ Yes | To run SapRfcBridge.exe |
| **Node.js** | ✅ Yes | To run your app |
| **SAP NCo DLLs** | ✅ Yes | SAP connector libraries |
| **.NET SDK** | ❌ No | .exe is pre-built |
| **Build tools** | ❌ No | No compilation needed |

### Base Image Options

1. **Recommended:** `mcr.microsoft.com/dotnet/framework/runtime:4.8`
   - Smallest Windows image with .NET Framework
   - Production-ready
   - ~2.5 GB

2. **Alternative:** `mcr.microsoft.com/windows/servercore:ltsc2022`
   - Full Windows Server Core
   - Includes .NET Framework 4.8
   - ~5 GB

3. **Not Recommended:** Linux + Wine
   - Complex setup
   - Unsupported by SAP
   - Performance issues

---

## Security Considerations

### 1. Don't Include DLLs in Image (for public images)

```dockerfile
# BAD: DLLs in image
COPY external/*.dll ./node_modules/sap-rfc-node-net/external/

# GOOD: Mount at runtime
# Use volumes in docker-compose or --mount in docker run
```

### 2. Use Secrets for Credentials

```dockerfile
# Use Docker secrets
CMD ["sh", "-c", "export SAP_PASSWORD=$(cat /run/secrets/sap_password) && node index.js"]
```

### 3. Minimal Base Image

Use the smallest base image that has .NET Framework 4.8:

```dockerfile
FROM mcr.microsoft.com/dotnet/framework/runtime:4.8-windowsservercore-ltsc2022
# This is smaller than full Windows Server
```

---

## Example Application

### index.js

```javascript
const SapRfcClient = require('sap-rfc-node-net');

const client = new SapRfcClient({
    host: process.env.SAP_HOST,
    client: process.env.SAP_CLIENT,
    sysNr: process.env.SAP_SYSNR || '00',
    user: process.env.SAP_USER,
    password: process.env.SAP_PASSWORD,
    lang: process.env.SAP_LANG || 'EN'
});

async function main() {
    try {
        console.log('Connecting to SAP...');
        await client.connect();
        console.log('Connected successfully!');
        
        const ping = await client.ping();
        console.log('SAP is alive:', ping.alive);
        
        // Your SAP operations here
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
```

---

## Kubernetes Deployment

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sap-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sap-app
  template:
    metadata:
      labels:
        app: sap-app
    spec:
      # Windows node selector
      nodeSelector:
        kubernetes.io/os: windows
      containers:
      - name: sap-app
        image: your-registry/sap-app:latest
        env:
        - name: SAP_HOST
          valueFrom:
            configMapKeyRef:
              name: sap-config
              key: host
        - name: SAP_USER
          valueFrom:
            secretKeyRef:
              name: sap-credentials
              key: username
        - name: SAP_PASSWORD
          valueFrom:
            secretKeyRef:
              name: sap-credentials
              key: password
        volumeMounts:
        - name: sap-dlls
          mountPath: /app/node_modules/sap-rfc-node-net/external
          readOnly: true
      volumes:
      - name: sap-dlls
        secret:
          secretName: sap-nco-dlls
```

---

## Testing

### Test in Docker

```bash
# Build
docker build -t sap-app-test .

# Run with environment variables
docker run --rm \
  -e SAP_HOST=test-server \
  -e SAP_CLIENT=400 \
  -e SAP_USER=testuser \
  -e SAP_PASSWORD=testpass \
  sap-app-test
```

---

## Summary

### Quick Answer: Yes, you need .NET Framework 4.8 Runtime

✅ **What to use:**
- Base image: `mcr.microsoft.com/dotnet/framework/runtime:4.8`
- Add Node.js to the image
- Copy SAP NCo DLLs to `external/` folder
- No build step needed (. exe is pre-built)

❌ **What you DON'T need:**
- .NET SDK
- Build tools
- Compilation steps

### Minimal Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/framework/runtime:4.8-windowsservercore-ltsc2022

# Install Node.js (use chocolatey or download MSI)
RUN powershell choco install nodejs -y

WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy SAP DLLs
COPY external/*.dll ./node_modules/sap-rfc-node-net/external/

COPY . .
CMD ["node", "index.js"]
```

That's it! The pre-built .exe just needs .NET Framework runtime to run.

