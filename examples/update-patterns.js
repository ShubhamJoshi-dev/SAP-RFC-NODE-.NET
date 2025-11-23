/**
 * Example: Different patterns for updating SAP data
 * Shows various ways to send data TO SAP
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
        console.log('✅ Connected\n');

        // ============================================================
        // Example 1: Simple parameters only
        // ============================================================
        console.log('Example 1: Simple Import Parameters');
        console.log('='.repeat(60));
        
        const result1 = await client.invokeFunction({
            functionName: 'Z_UPDATE_SIMPLE',
            importParams: {
                I_PARAM1: 'value1',
                I_PARAM2: 'value2'
            },
            exportParams: ['E_RESULT']
        });
        console.log('Result:', result1.exports);
        console.log();

        // ============================================================
        // Example 2: Send a structure to SAP
        // ============================================================
        console.log('Example 2: Send Structure (like SetValue on structure)');
        console.log('='.repeat(60));
        
        const result2 = await client.invokeFunction({
            functionName: 'Z_UPDATE_WITH_STRUCT',
            
            // This structure will be populated field by field
            importStructures: {
                I_HEADER: {
                    FIELD1: 'value1',
                    FIELD2: 'value2',
                    FIELD3: 'value3'
                }
            },
            exportParams: ['E_STATUS']
        });
        console.log('Result:', result2.exports);
        console.log();

        // ============================================================
        // Example 3: Send table rows to SAP
        // ============================================================
        console.log('Example 3: Send Table Data (like Append to table)');
        console.log('='.repeat(60));
        
        const result3 = await client.invokeFunction({
            functionName: 'Z_UPDATE_WITH_TABLE',
            
            // Each array item becomes a row in the SAP table
            importTables: {
                T_ITEMS: [
                    { ITEM: '001', QTY: '10', PRICE: '100.00' },
                    { ITEM: '002', QTY: '20', PRICE: '200.00' },
                    { ITEM: '003', QTY: '15', PRICE: '150.00' }
                ]
            },
            exportParams: ['E_TOTAL']
        });
        console.log('Result:', result3.exports);
        console.log();

        // ============================================================
        // Example 4: Complete example - all together
        // ============================================================
        console.log('Example 4: Complete Update (params + structure + table)');
        console.log('='.repeat(60));
        
        const result4 = await client.invokeFunction({
            functionName: 'Z_COMPLETE_UPDATE',
            
            // Simple parameters
            importParams: {
                I_DOC_TYPE: 'ORDER',
                I_DOC_NUMBER: '12345'
            },
            
            // Header structure
            importStructures: {
                I_HEADER: {
                    DOC_TYPE: 'ORDER',
                    DOC_NUMBER: '12345',
                    CUSTOMER: 'CUST001',
                    DATE: '20240101'
                }
            },
            
            // Line items table
            importTables: {
                T_ITEMS: [
                    { ITEM: '10', MATERIAL: 'MAT001', QTY: '5' },
                    { ITEM: '20', MATERIAL: 'MAT002', QTY: '3' }
                ]
            },
            
            // Get results back
            exportParams: ['E_STATUS', 'E_MESSAGE'],
            structures: ['E_RESULT'],
            tables: ['T_LOG'],
            
            endContext: true
        });
        
        console.log('Status:', result4.exports?.E_STATUS);
        console.log('Message:', result4.exports?.E_MESSAGE);
        console.log('Result Structure:', result4.structures?.E_RESULT);
        console.log('Log Entries:', result4.tables?.T_LOG?.length || 0);
        console.log();

        // ============================================================
        // Example 5: Vendor Update (Your specific case)
        // ============================================================
        console.log('Example 5: Vendor Update');
        console.log('='.repeat(60));
        
        const result5 = await client.invokeFunction({
            functionName: 'ZFI_MFP_VENDOR_UPDATE',
            
            importStructures: {
                I_DATA: {
                    LIFNR: '00010001',
                    BUKRS: '1000',
                    NAME1: 'Vendor Name',
                    CITY1: 'New York',
                    COUNTRY: 'US',
                    // ... all vendor fields
                }
            },
            
            importTables: {
                T_BANK: [
                    {
                        LIFNR: '00010001',
                        BUKRS: '1000',
                        BANKS: 'US',
                        BANKL: '123456789',
                        BANKN: '987654321',
                        KOINH: 'Account Holder'
                    }
                ]
            },
            
            exportParams: ['E_MSG'],
            endContext: true
        });
        
        console.log('SAP Message:', result5.exports?.E_MSG);
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

