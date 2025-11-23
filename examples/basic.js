/**
 * Basic Example - SAP RFC Connection
 */

const SapRfcClient = require('../index');

// Configuration (use environment variables in production!)
const config = {
    host: process.env.SAP_HOST || '192.168.65.57',
    client: process.env.SAP_CLIENT || '400',
    sysNr: process.env.SAP_SYSNR || '01',
    user: process.env.SAP_USER || 'YOUR_USERNAME',
    password: process.env.SAP_PASSWORD || 'YOUR_PASSWORD',
    lang: 'EN'
};

async function main() {
    const client = new SapRfcClient(config);
    
    try {
        console.log('🔌 Connecting to SAP...');
        const info = await client.connect();
        console.log('✅ Connected to SAP System:');
        console.log('   System ID:', info.systemId);
        console.log('   Client:', info.client);
        console.log('   Release:', info.release);
        console.log();
        
        console.log('🏓 Pinging SAP...');
        await client.ping();
        console.log('✅ SAP system is alive');
        console.log();
        
        console.log('📞 Calling STFC_CONNECTION...');
        const result = await client.invoke('STFC_CONNECTION', {
            REQUTEXT: 'Hello from Node.js!'
        });
        console.log('✅ RFC Response:');
        console.log('   Echo:', result.ECHOTEXT);
        console.log('   Response:', result.RESPTEXT);
        console.log();
        
        console.log('🎉 All tests passed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
        console.log('👋 Connection closed');
    }
}

main();

