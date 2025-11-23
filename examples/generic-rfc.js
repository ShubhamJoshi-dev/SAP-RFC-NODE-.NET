/**
 * Example: Generic RFC calls showing all capabilities
 */

const SapRfcClient = require('../index');

async function examples() {
    const client = new SapRfcClient({
        host: '192.168.65.57',
        client: '400',
        sysNr: '01',
        user: 'USERNAME',
        password: 'PASSWORD'
    });

    try {
        await client.connect();
        console.log('✅ Connected to SAP\n');

        // Example 1: Simple RFC with only export parameters
        console.log('Example 1: RFC_SYSTEM_INFO');
        console.log('='.repeat(50));
        const sysInfo = await client.invokeFunction({
            functionName: 'RFC_SYSTEM_INFO',
            exportParams: ['RFCSI_EXPORT']
        });
        console.log('System Info:', sysInfo.exports);
        console.log();

        // Example 2: RFC with import and export parameters
        console.log('Example 2: STFC_CONNECTION');
        console.log('='.repeat(50));
        const echo = await client.invokeFunction({
            functionName: 'STFC_CONNECTION',
            importParams: {
                REQUTEXT: 'Hello SAP!'
            },
            exportParams: ['ECHOTEXT', 'RESPTEXT']
        });
        console.log('Echo:', echo.exports?.ECHOTEXT);
        console.log('Response:', echo.exports?.RESPTEXT?.substring(0, 50));
        console.log();

        // Example 3: RFC with table return
        console.log('Example 3: RFC_READ_TABLE');
        console.log('='.repeat(50));
        const tableData = await client.invokeFunction({
            functionName: 'RFC_READ_TABLE',
            importParams: {
                QUERY_TABLE: 'T000',
                DELIMITER: '|',
                ROWCOUNT: 5
            },
            tables: ['DATA', 'FIELDS'],
            endContext: false
        });
        console.log('Rows:', tableData.tables?.DATA?.length || 0);
        console.log('Fields:', tableData.tables?.FIELDS?.length || 0);
        console.log();

        // Example 4: RFC with structure return
        console.log('Example 4: Custom RFC with Structure');
        console.log('='.repeat(50));
        const customData = await client.invokeFunction({
            functionName: 'YOUR_CUSTOM_RFC',
            importParams: {
                PARAM1: 'value1',
                PARAM2: 'value2'
            },
            exportParams: ['STATUS', 'MESSAGE'],
            structures: ['RETURN_STRUCT'],
            tables: ['RESULT_TABLE'],
            endContext: true  // End SAP session after this call
        });
        console.log('Structure:', customData.structures);
        console.log('Table rows:', customData.tables?.RESULT_TABLE?.length || 0);
        console.log();

        // Example 5: Vendor data (your specific use case)
        console.log('Example 5: Vendor Data');
        console.log('='.repeat(50));
        const vendorData = await client.invokeFunction({
            functionName: 'ZFI_MFP_VENDOR_DATA',
            importParams: {
                I_LIFNR: '00010001',
                I_BUKRS: '1000'
            },
            exportParams: ['E_MSG'],
            structures: ['E_DATA'],
            tables: ['T_BANK', 'T_DOC', 'T_DOCITEMS'],
            endContext: true
        });
        
        console.log('Vendor:', Object.keys(vendorData.structures?.E_DATA || {}).length, 'fields');
        console.log('Banks:', vendorData.tables?.T_BANK?.length || 0);
        console.log('Documents:', vendorData.tables?.T_DOC?.length || 0);
        console.log('Items:', vendorData.tables?.T_DOCITEMS?.length || 0);
        console.log();

        console.log('🎉 All examples completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    examples().catch(console.error);
}

module.exports = { examples };

