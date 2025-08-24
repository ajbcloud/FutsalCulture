import { Resend } from "resend";
import { env } from "./env";
const resend = new Resend(env.RESEND_API_KEY);
const FROM = env.EMAIL_FROM;

export async function sendVerifyEmail(to: string, link: string) {
await resend.emails.send({ from: FROM, to, subject: "Verify your email", html: `<p>Welcome to Futsal Culture.</p><p><a href="${link}">Verify</a></p>` });
}

export async function sendInviteEmail(to: string, link: string, role: string, tenantName: string) {
await resend.emails.send({ from: FROM, to, subject: `Invite to ${tenantName}`, html: `<p>You are invited as ${role}.</p><p><a href="${link}">Accept invite</a></p>` });
}

export async function sendWelcomeEmail(to: string, tenantName: string) {
await resend.emails.send({ from: FROM, to, subject: `Welcome to ${tenantName}`, html: `<p>You are all set.</p>` });
}