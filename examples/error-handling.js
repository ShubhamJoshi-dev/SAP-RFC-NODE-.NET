/**
 * Error Handling Example
 */

const SapRfcClient = require('../index');

async function main() {
    const client = new SapRfcClient({
        host: process.env.SAP_HOST || '192.168.65.57',
        client: process.env.SAP_CLIENT || '400',
        sysNr: process.env.SAP_SYSNR || '01',
        user: process.env.SAP_USER,
        password: process.env.SAP_PASSWORD
    });
    
    try {
        // Connect
        console.log('Connecting...');
        await client.connect();
        console.log('✅ Connected');
        
        // Try to call non-existent function
        console.log('\nTrying to call non-existent RFC...');
        try {
            await client.invoke('NON_EXISTENT_FUNCTION', {});
        } catch (error) {
            console.log('❌ Expected error:', error.message);
        }
        
        // Try with invalid parameters
        console.log('\nTrying with invalid parameters...');
        try {
            await client.invoke('STFC_CONNECTION', {
                INVALID_PARAM: 'test'
            });
        } catch (error) {
            console.log('❌ Expected error:', error.message);
        }
        
        // Successful call
        console.log('\nMaking valid call...');
        const result = await client.invoke('RFC_PING', {});
        console.log('✅ Success!');
        
    } catch (error) {
        if (error.message.includes('COMMUNICATION_FAILURE')) {
            console.error('❌ Network error - Cannot reach SAP system');
        } else if (error.message.includes('LOGON_FAILURE')) {
            console.error('❌ Authentication failed - Check credentials');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await client.close();
        console.log('\n👋 Disconnected');
    }
}

main();

