// --- Utility helpers ---
function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

// --- Generate or get a stored AES key ---
async function getKey() {
    let storedKey = sessionStorage.getItem("encKey");
    if (storedKey) {
        const raw = base64ToArrayBuffer(storedKey);
        return await crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
    } else {
        const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
        const exported = await crypto.subtle.exportKey("raw", key);
        sessionStorage.setItem("encKey", arrayBufferToBase64(exported));
        return key;
    }
}

// --- Encrypt a string ---
export async function encrypt(value) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Random IV for each encryption
    const encoded = new TextEncoder().encode(value);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    return JSON.stringify({
        iv: arrayBufferToBase64(iv),
        data: arrayBufferToBase64(ciphertext)
    });
}

// --- Decrypt a string ---
export async function decrypt(encryptedValue) {
    const key = await getKey();
    const { iv, data } = JSON.parse(encryptedValue);
    const ivBuffer = base64ToArrayBuffer(iv);
    const dataBuffer = base64ToArrayBuffer(data);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
        key,
        dataBuffer
    );
    return new TextDecoder().decode(decrypted);
}