/**
 * Custom RFC Example - Execute any RFC function
 */

const SapRfcClient = require('../index');

async function executeRfc(functionName, params = {}) {
    const client = new SapRfcClient({
        host: process.env.SAP_HOST || '192.168.65.57',
        client: process.env.SAP_CLIENT || '400',
        sysNr: process.env.SAP_SYSNR || '01',
        user: process.env.SAP_USER,
        password: process.env.SAP_PASSWORD
    });
    
    try {
        await client.connect();
        console.log(`Executing ${functionName}...`);
        
        const result = await client.invoke(functionName, params);
        console.log('Result:', JSON.stringify(result, null, 2));
        
        return result;
    } finally {
        await client.close();
    }
}

// Example 1: Read SAP table
async function readTable() {
    console.log('\n📊 Example 1: Read SAP Table (T000)');
    console.log('='.repeat(50));
    
    const result = await executeRfc('RFC_READ_TABLE', {
        QUERY_TABLE: 'T000',
        DELIMITER: '|',
        ROWCOUNT: '5'
    });
    
    console.log('✅ Table data retrieved');
}

// Example 2: Get system info
async function getSystemInfo() {
    console.log('\n🖥️  Example 2: Get System Info');
    console.log('='.repeat(50));
    
    const result = await executeRfc('RFC_SYSTEM_INFO', {});
    console.log('✅ System info retrieved');
}

// Example 3: Execute BAPI
async function executeBapi() {
    console.log('\n🔧 Example 3: Execute BAPI');
    console.log('='.repeat(50));
    
    const result = await executeRfc('BAPI_USER_GET_DETAIL', {
        USERNAME: 'SAPUSER'
    });
    
    console.log('✅ BAPI executed');
}

// Run examples
async function main() {
    try {
        await readTable();
        // await getSystemInfo();
        // await executeBapi();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();

