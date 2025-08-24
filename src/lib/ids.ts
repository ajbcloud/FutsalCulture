export function randomToken(length = 48) {
const bytes = crypto.getRandomValues(new Uint8Array(length));
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
return Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
}

export function slugify(name: string) {
return name
.toLowerCase()
.replace(/[^a-z0-9]+/g, "-")
.replace(/(^-|-$)+/g, "");
}

export function generateTenantCode() {
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let code = "";
for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
return code;
}