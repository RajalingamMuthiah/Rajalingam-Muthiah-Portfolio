import { Resend } from "resend";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "rajalingammathiah2011@gmail.com";
const FROM_ADMIN = "Portfolio <no-reply@yourdomain.com>";
const FROM_USER_REPLY = "Rajalingam <no-reply@yourdomain.com>";

export async function POST(req: Request) {
  console.log("[CONTACT API] Request received at", new Date().toISOString());
  
  try {
    // DEBUG: Check env var presence
    const hasApiKey = !!process.env.RESEND_API_KEY;
    const apiKeyPreview = process.env.RESEND_API_KEY 
      ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` 
      : "NOT SET";
    
    console.log("[CONTACT API] API Key status:", hasApiKey ? "PRESENT" : "MISSING");
    console.log("[CONTACT API] API Key preview:", apiKeyPreview);
    console.log("[CONTACT API] All env keys:", Object.keys(process.env).filter(k => k.includes("RESEND")).join(", ") || "NONE");

    if (!process.env.RESEND_API_KEY) {
      console.error("[CONTACT API] FATAL: RESEND_API_KEY not configured in environment");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email service not configured. Admin must set RESEND_API_KEY in Vercel environment variables." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
      console.log("[CONTACT API] Body parsed successfully");
    } catch (parseErr) {
      console.error("[CONTACT API] Failed to parse JSON:", parseErr);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, email, message } = body;

    // Validate fields
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      console.warn("[CONTACT API] Validation failed - missing fields");
      return new Response(
        JSON.stringify({ success: false, error: "Name, email, and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (message.trim().length < 10) {
      console.warn("[CONTACT API] Message too short:", message.trim().length, "chars");
      return new Response(
        JSON.stringify({ success: false, error: "Message must be at least 10 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[CONTACT API] Validation passed. Initializing Resend client...");
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("[CONTACT API] Sending admin notification to:", ADMIN_EMAIL);
    const adminRes = await resend.emails.send({
      from: FROM_ADMIN,
      to: ADMIN_EMAIL,
      subject: `New Contact: ${name.trim()}`,
      html: `<p><strong>From:</strong> ${name.trim()} (${email.trim()})</p><p><strong>Message:</strong></p><p>${message.trim()}</p>`,
    });

    if (adminRes.error) {
      console.error("[CONTACT API] Admin email send failed:", JSON.stringify(adminRes.error));
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send notification email" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[CONTACT API] Admin email sent successfully. ID:", adminRes.data?.id);

    // Send confirmation email (non-blocking)
    console.log("[CONTACT API] Sending confirmation email to:", email.trim());
    resend.emails
      .send({
        from: FROM_USER_REPLY,
        to: email.trim(),
        subject: `Thank you, ${name.trim()}! We received your message`,
        html: `<p>Hi ${name.trim()},</p><p>Thank you for contacting us. We'll get back to you within 24-48 hours.</p><p>Best regards,<br>Rajalingam</p>`,
      })
      .then(() => console.log("[CONTACT API] Confirmation email sent successfully"))
      .catch((err) => console.error("[CONTACT API] Confirmation email failed (non-critical):", err));

    console.log("[CONTACT API] Returning success response");
    return new Response(
      JSON.stringify({ success: true, message: "Email sent! Check your inbox for confirmation." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[CONTACT API] UNHANDLED ERROR:", err instanceof Error ? err.stack : JSON.stringify(err));
    return new Response(
      JSON.stringify({ success: false, error: "Server error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
