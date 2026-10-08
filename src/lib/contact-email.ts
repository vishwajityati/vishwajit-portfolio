import "server-only";
import nodemailer from "nodemailer";

interface ContactEmail {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface MailConfiguration {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export function getContactEmailConfigurationStatus(): { configured: boolean; missingSettings: string[] } {
  const missingSettings = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"].filter((name) => {
    return !process.env[name]?.trim();
  });
  const port = Number(process.env.SMTP_PORT?.trim());

  if (process.env.SMTP_PORT?.trim() && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    missingSettings.push("SMTP_PORT (must be a port from 1 to 65535)");
  }

  return { configured: missingSettings.length === 0, missingSettings };
}

function getMailConfiguration(): MailConfiguration | null {
  if (!getContactEmailConfigurationStatus().configured) return null;

  const host = process.env.SMTP_HOST?.trim();
  const portValue = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  if (!host || !portValue || !user || !password) return null;

  const from = process.env.SMTP_FROM?.trim() || user;
  const port = Number(portValue);
  const normalizedPassword = host.toLowerCase() === "smtp.gmail.com"
    ? password.replace(/\s+/g, "")
    : password;

  return { host, port, user, password: normalizedPassword, from };
}

export async function sendContactEmail(recipient: string, submission: ContactEmail): Promise<boolean> {
  const configuration = getMailConfiguration();
  if (!configuration) return false;

  const transporter = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.port === 465,
    requireTLS: configuration.port !== 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: { user: configuration.user, pass: configuration.password },
    tls: { minVersion: "TLSv1.2" }
  });

  await transporter.sendMail({
    from: configuration.from,
    to: recipient,
    replyTo: { name: submission.name, address: submission.email },
    subject: `New portfolio message from ${submission.name}`,
    text: [
      `From: ${submission.name}`,
      `Email: ${submission.email}`,
      `Phone: ${submission.phone || "Not provided"}`,
      "",
      submission.message
    ].join("\n")
  });

  return true;
}
