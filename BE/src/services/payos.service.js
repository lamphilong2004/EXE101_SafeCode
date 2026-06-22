import PayOSPkg from '@payos/node';

const PayOS = PayOSPkg.PayOS || PayOSPkg.default?.PayOS || PayOSPkg;

const clientId = process.env.PAYOS_CLIENT_ID || 'dummy_client_id';
const apiKey = process.env.PAYOS_API_KEY || 'dummy_api_key';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key';

// Check if credentials are placeholders
// Check if credentials are placeholders
export const isPayosConfigured = 
  clientId !== 'dummy_client_id' && 
  clientId !== 'YOUR_PAYOS_CLIENT_ID' &&
  clientId.trim() !== '';

// Try both signatures just in case, but first let's manually inject into process.env to satisfy the library if it reads from it
process.env.PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || clientId;
process.env.PAYOS_API_KEY = process.env.PAYOS_API_KEY || apiKey;
process.env.PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || checksumKey;

let payos;
try {
  payos = new PayOS(clientId, apiKey, checksumKey);
} catch (err) {
  payos = new PayOS({ clientId, apiKey, checksumKey });
}

export default payos;
