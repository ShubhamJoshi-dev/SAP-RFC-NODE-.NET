/**
 * Example: Update/Save Vendor Data to SAP
 * Demonstrates sending structures and tables to SAP (INPUT data)
 */

const SapRfcClient = require('../index');

async function updateVendorData() {
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

        // Prepare vendor data to update
        const vendorData = {
            LIFNR: '00010001',          // Vendor number
            BUKRS: '1000',              // Company code
            NAME1: 'Updated Vendor Name',
            KVERM: 'Memo text',
            CITY1: 'New York',
            POST_CODE1: '10001',
            STREET: '123 Main Street',
            STR_SUPPL3: 'Suite 400',
            COUNTRY: 'US',
            REGION: 'NY',
            TEL_NUMBER: '+1234567890',
            SMTP_ADDR: 'vendor@example.com',
            UNDEL: '',
            UNDELIVER: '',
            ZWELS: 'C',                 // Payment method
            WEBTR: '100.00',            // Minimum payment threshold
            QLAND: 'US',                // Withholding country
            WAERS: 'USD',               // Payment currency
            STCD1: '123456789',         // Tax number 1
            STCD2: '987654321',         // Tax number 2
            STCEG: 'US12345678',        // VAT registration
            WT_EXNR: '',                // Exemption cert number
            WT_EXRT: '0.00',            // Exemption rate
            WT_EXDF: '20240101',        // Exemption begin date
            WT_EXDT: '20241231'         // Exemption end date
        };

        // Prepare bank data (table rows)
        const bankData = [
            {
                LIFNR: '00010001',
                BUKRS: '1000',
                BANKS: 'US',            // Bank country
                BANKL: '123456789',     // Bank key
                BANKA: 'Chase Bank',    // Bank name
                BANKN: '987654321',     // Bank account number
                BKONT: '',              // Bank control key
                KOINH: 'Account Holder Name',
                IBAN: '',               // IBAN
                INTER: ''               // Intermediary bank flag (X or blank)
            }
        ];

        // For PayPal, use special values
        const isPayPal = false; // Set to true for PayPal
        if (isPayPal) {
            bankData[0] = {
                LIFNR: '00010001',
                BUKRS: '1000',
                BANKS: 'US',
                BANKL: '123456789',
                BANKA: '',
                BANKN: '123456789',
                BKONT: '',
                KOINH: 'PayPal Account Name',
                IBAN: '',
                INTER: ''
            };
        }

        console.log('💾 Updating vendor data in SAP...');
        console.log('   Vendor:', vendorData.LIFNR);
        console.log('   Company:', vendorData.BUKRS);
        console.log('   Name:', vendorData.NAME1);
        console.log();

        // Call the update function
        const result = await client.invokeFunction({
            functionName: 'ZFI_MFP_VENDOR_UPDATE',
            
            // Send vendor data as structure (like SetValue on structure)
            importStructures: {
                I_DATA: vendorData
            },
            
            // Send bank data as table (like Append to table)
            importTables: {
                T_BANK: bankData
            },
            
            // Get response message
            exportParams: ['E_MSG'],
            
            // End SAP session
            endContext: true
        });

        console.log('✅ RFC executed successfully!\n');

        // Check the response
        const errorMessage = result.exports?.E_MSG || '';
        
        console.log('📨 SAP Response:');
        console.log('='.repeat(60));
        console.log('  Message:', errorMessage);
        console.log('='.repeat(60));
        console.log();

        if (errorMessage === 'Vendor Data has been saved.') {
            console.log('✅ SUCCESS! Vendor data updated in SAP');
            return { success: true, message: errorMessage };
        } else if (errorMessage.length === 0) {
            console.log('⚠️  Warning: No response from SAP');
            return { success: false, message: 'The vendor did not update. No error returned from SAP' };
        } else {
            console.log('❌ Error: Vendor not updated');
            return { success: false, message: 'The vendor did not update. ' + errorMessage };
        }

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
    updateVendorData()
        .then(result => {
            console.log('\n🎉 Final Result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { updateVendorData };

