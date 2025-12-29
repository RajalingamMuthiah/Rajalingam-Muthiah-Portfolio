import { Resend } from "resend";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "rajalingammathiah2011@gmail.com";
const FROM_ADMIN = "Portfolio Contact <onboarding@resend.dev>";
const FROM_USER_REPLY = "Rajalingam Mathiah <onboarding@resend.dev>";

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const { name, email, message } = (await req.json()) as ContactPayload;
    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim();
    const trimmedMessage = (message || "").trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (trimmedMessage.length < 10) {
      return Response.json(
        { error: "Message is too short. Please provide at least 10 characters." },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const adminSend = await resend.emails.send({
      from: FROM_ADMIN,
      to: ADMIN_EMAIL,
      subject: `New Portfolio Contact: ${trimmedName}`,
      html: `<h2>New message from ${trimmedName}</h2><p>Email: ${trimmedEmail}</p><p>Message: ${trimmedMessage}</p>`,
    });

    if (adminSend.error) {
      console.error("Resend admin error", adminSend.error);
      return Response.json(
        {
          error:
            (adminSend.error as any)?.message || "Failed to send admin email",
        },
        { status: 500 }
      );
    }

    const userSend = await resend.emails.send({
      from: FROM_USER_REPLY,
      to: trimmedEmail,
      subject: `Thank you ${trimmedName}! Message received`,
      html: `<h2>Hi ${trimmedName},</h2><p>Thank you for contacting us. We received your message and will reply within 24-48 hours.</p><p>Best,<br>Rajalingam Mathiah</p>`,
    });

    if (userSend.error) {
      console.error("Resend user error", userSend.error);
      return Response.json(
        { error: (userSend.error as any)?.message || "Failed to send reply" },
        { status: 500 }
      );
    }

    console.log("Contact form sent", { admin: adminSend.data, user: userSend.data });

    return Response.json({ success: true, message: "Email sent! Check your inbox." });
  } catch (error) {
    console.error("Contact API error", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
