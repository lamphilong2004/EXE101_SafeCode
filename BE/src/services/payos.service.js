import PayOSPkg from '@payos/node';

const PayOS = PayOSPkg.PayOS || PayOSPkg.default?.PayOS || PayOSPkg;

const clientId = process.env.PAYOS_CLIENT_ID || 'dummy_client_id';
const apiKey = process.env.PAYOS_API_KEY || 'dummy_api_key';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key';

// Check if credentials are placeholders
export const isPayosConfigured = 
  clientId !== 'dummy_client_id' && 
  clientId !== 'YOUR_PAYOS_CLIENT_ID' &&
  clientId.trim() !== '';

const payos = new PayOS({ clientId, apiKey, checksumKey });

export default payos;
