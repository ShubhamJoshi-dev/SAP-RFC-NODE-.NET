const SapRfcClient = require('sap-rfc-node-net');

/**
 * Example: Check package setup before connecting
 * 
 * This shows how to verify your setup step-by-step
 */

async function checkSetup() {
    console.log('SAP RFC Node.js Setup Verification');
    console.log('===================================\n');
    
    const client = new SapRfcClient({
        host: 'your-sap-host',
        client: '100',
        sysNr: '00',
        user: 'your-username',
        password: 'your-password'
    });
    
    // Step 1: Check Node.js <-> .NET communication
    console.log('Step 1: Checking Node.js <-> .NET communication...');
    try {
        const syncResult = await client.sync();
        console.log('✅ Communication works:', syncResult.message);
    } catch (error) {
        console.error('❌ Communication failed:', error.message);
        console.error('   This means the .NET bridge is not working properly.');
        return;
    }
    
    console.log('');
    
    // Step 2: Check if SAP NCo DLLs are present
    console.log('Step 2: Checking SAP NCo DLLs...');
    try {
        const dllResult = await client.checkDlls();
        console.log('✅ DLLs found:', dllResult.message);
    } catch (error) {
        console.error('❌ DLLs missing!');
        console.error(error.message);
        console.error('\nPlease follow the setup instructions in SETUP.md');
        return;
    }
    
    console.log('');
    
    // Step 3: Try to connect to SAP
    console.log('Step 3: Testing SAP connection...');
    try {
        const connResult = await client.connect();
        console.log('✅ Connected to SAP:', connResult.system);
        
        // Step 4: Ping SAP
        console.log('\nStep 4: Testing SAP ping...');
        const pingResult = await client.ping();
        console.log('✅ Ping successful:', pingResult.message);
        
        // Clean up
        await client.close();
        
        console.log('\n===================================');
        console.log('✅ ALL CHECKS PASSED!');
        console.log('Your setup is ready to use.');
        console.log('===================================');
        
    } catch (error) {
        console.error('❌ SAP connection failed:', error.message);
        console.error('\nPossible issues:');
        console.error('- Check your SAP credentials');
        console.error('- Verify SAP host is reachable');
        console.error('- Check if VPN is required');
        console.error('- Verify firewall settings');
    }
}

checkSetup();

