/**
 * SafeCode Decrypt Worker
 * Runs AES-256-GCM decryption off the main thread so the UI never freezes.
 * 
 * Messages received (postMessage from main):
 *   { type: 'decrypt', encryptedBuffer: ArrayBuffer, keyB64: string, ivB64: string, authTagB64: string }
 *
 * Messages sent (postMessage to main):
 *   { type: 'progress', percent: number }   — download / prep progress
 *   { type: 'done',     blob: Blob }         — decrypted result
 *   { type: 'error',    message: string }    — something went wrong
 */

self.onmessage = async (event) => {
  const { type, encryptedBuffer, keyB64, ivB64, authTagB64 } = event.data;
  if (type !== 'decrypt') return;

  try {
    self.postMessage({ type: 'progress', percent: 10, label: 'Đang chuẩn bị khoá giải mã...' });

    // Decode base64 helpers
    const b64ToBytes = (b64) => {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    };

    const rawKey  = b64ToBytes(keyB64);
    const iv      = b64ToBytes(ivB64);
    const authTag = b64ToBytes(authTagB64);

    if (rawKey.length !== 32) throw new Error('Khoá AES không hợp lệ (phải 32 bytes).');
    if (iv.length !== 12)     throw new Error('IV không hợp lệ (phải 12 bytes).');

    self.postMessage({ type: 'progress', percent: 30, label: 'Đang nhập khoá vào Web Crypto...' });

    const cryptoKey = await self.crypto.subtle.importKey(
      'raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']
    );

    self.postMessage({ type: 'progress', percent: 50, label: 'Đang ghép dữ liệu...' });

    // Append authTag to ciphertext (Web Crypto expects ciphertext+tag combined)
    const encBytes = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(encBytes.byteLength + authTag.byteLength);
    combined.set(encBytes);
    combined.set(authTag, encBytes.byteLength);

    self.postMessage({ type: 'progress', percent: 65, label: 'Đang giải mã AES-256-GCM...' });

    const decrypted = await self.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      combined
    );

    self.postMessage({ type: 'progress', percent: 90, label: 'Đang tạo file tải xuống...' });

    const blob = new Blob([decrypted], { type: 'application/zip' });

    self.postMessage({ type: 'progress', percent: 100, label: 'Hoàn tất!' });

    // Transfer the blob — postMessage supports transferable ArrayBuffer
    const resultBuffer = await blob.arrayBuffer();
    self.postMessage({ type: 'done', buffer: resultBuffer }, [resultBuffer]);

  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'Giải mã thất bại.' });
  }
};
