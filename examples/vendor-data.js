/**
 * Example: Get Vendor Data using generic invokeFunction
 * This shows how to call ZFI_MFP_VENDOR_DATA with structures and tables
 */

const SapRfcClient = require('../index');

async function getVendorData() {
    const client = new SapRfcClient({
        host: process.env.SAP_HOST || '192.168.65.57',
        client: process.env.SAP_CLIENT || '400',
        sysNr: process.env.SAP_SYSNR || '01',
        user: process.env.SAP_USER || 'EDH_SRV_USR',
        password: process.env.SAP_PASSWORD || 'M@ster123',
        lang: 'EN'
    });

    try {
        console.log('🔌 Connecting to SAP...');
        await client.connect();
        console.log('✅ Connected\n');

        console.log('📞 Calling ZFI_MFP_VENDOR_DATA...');
        const result = await client.invokeFunction({
            functionName: 'ZFI_MFP_VENDOR_DATA',
            
            // Set import parameters (like SetValue in .NET)
            importParams: {
                I_LIFNR: '00010001',  // Vendor number
                I_BUKRS: '1000'       // Company code
            },
            
            // Get export parameters
            exportParams: ['E_MSG'],
            
            // Get structures (like GetStructure in .NET)
            structures: ['E_DATA'],
            
            // Get tables (like GetTable in .NET)
            tables: ['T_BANK', 'T_DOC', 'T_DOCITEMS'],
            
            // End context after execution (like RfcSessionManager.EndContext)
            endContext: true
        });

        console.log('✅ RFC executed successfully!\n');

        // Display results in clean format
        console.log('📊 Results:');
        console.log('='.repeat(60));
        
        if (result.exports) {
            console.log('\n📤 Export Parameters:');
            console.log('  Error Message:', result.exports.E_MSG || 'None');
        }

        if (result.structures && result.structures.E_DATA) {
            console.log('\n📋 Vendor Data (Structure E_DATA):');
            const vendor = result.structures.E_DATA;
            Object.keys(vendor).slice(0, 10).forEach(key => {
                if (vendor[key]) console.log(`  ${key}: ${vendor[key]}`);
            });
        }

        if (result.tables && result.tables.T_BANK) {
            console.log('\n🏦 Banks (Table T_BANK):');
            console.log(`  Found ${result.tables.T_BANK.length} bank(s)`);
            result.tables.T_BANK.slice(0, 3).forEach((bank, i) => {
                console.log(`  Bank ${i + 1}:`, JSON.stringify(bank, null, 2).substring(0, 100));
            });
        }

        if (result.tables && result.tables.T_DOC) {
            console.log('\n📄 Documents (Table T_DOC):');
            console.log(`  Found ${result.tables.T_DOC.length} document(s)`);
        }

        if (result.tables && result.tables.T_DOCITEMS) {
            console.log('\n📑 Document Items (Table T_DOCITEMS):');
            console.log(`  Found ${result.tables.T_DOCITEMS.length} item(s)`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n🎉 Success! Data retrieved from SAP');

        // You can now use the data in your application
        const vendorInfo = {
            vendor: result.structures?.E_DATA || {},
            banks: result.tables?.T_BANK || [],
            documents: result.tables?.T_DOC || [],
            documentItems: result.tables?.T_DOCITEMS || [],
            errorMessage: result.exports?.E_MSG || ''
        };

        return vendorInfo;

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        await client.close();
        console.log('\n👋 Connection closed');
    }
}

// Run if called directly
if (require.main === module) {
    getVendorData().catch(console.error);
}

module.exports = { getVendorData };

