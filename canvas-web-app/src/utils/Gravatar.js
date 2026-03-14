export async function getGravatarUrl(id) {
    const address = String(id).trim().toLowerCase();

    const msgUint8 = new TextEncoder().encode(address);

    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `https://www.gravatar.com/avatar/${hashHex}?d=retro`;
}