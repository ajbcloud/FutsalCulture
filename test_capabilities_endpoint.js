// Test capabilities endpoint by directly calling the function
const { getTenantCapabilities } = require('./server/controllers/tenant/capabilities.ts');

async function testCapabilities() {
  try {
    const mockReq = {
      tenantId: 'd98c4191-c7e0-474d-9dd7-672219d85e4d'
    };
    
    const mockRes = {
      json: (data) => {
        console.log('✅ Capabilities response:', JSON.stringify(data, null, 2));
        return data;
      },
      setHeader: (name, value) => {
        console.log(`Header: ${name} = ${value}`);
      }
    };
    
    console.log('Testing getTenantCapabilities function directly...');
    await getTenantCapabilities(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Error testing capabilities:', error);
  }
}

testCapabilities();
