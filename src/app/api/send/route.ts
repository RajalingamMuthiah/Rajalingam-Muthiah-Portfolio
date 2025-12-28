// import { EmailTemplate } from "@/components/email-template";
// import { AcknowledgementEmailTemplate } from "@/components/email-acknowledgement";
// import { config } from "@/data/config";
// import { Resend } from "resend";
// import { z } from "zod";

// const Email = z.object({
//   fullName: z.string().min(2, "Full name is invalid!"),
//   email: z.string().email({ message: "Email is invalid!" }),
//   message: z.string().min(10, "Message is too short!"),
// });

// // Export route config to make it dynamic
// export const dynamic = 'force-dynamic';

// /**
//  * Type definitions for email responses
//  */
// interface EmailResponse {
//   id?: string;
//   error?: string;
// }

// /**
//  * POST /api/send
//  * Handles contact form submissions and sends two emails:
//  * 1. Notification email to the portfolio owner
//  * 2. Acknowledgement email to the sender
//  */
// export async function POST(req: Request) {
//   try {
//     // Validate API key availability
//     const apiKey = process.env.RESEND_API_KEY;
//     if (!apiKey) {
//       console.error("RESEND_API_KEY not configured");
//       return Response.json(
//         { error: "Email service not configured" },
//         { status: 500 }
//       );
//     }

//     const resend = new Resend(apiKey);
//     const body = await req.json();
    
//     // Validate request body
//     const {
//       success: zodSuccess,
//       data: zodData,
//       error: zodError,
//     } = Email.safeParse(body);
    
//     if (!zodSuccess) {
//       return Response.json(
//         { error: zodError?.message || "Validation failed" },
//         { status: 400 }
//       );
//     }

//     /**
//      * Step 1: Send notification email to portfolio owner
//      */
//     const { data: ownerEmailData, error: ownerEmailError } = await resend.emails.send({
//       from: "Portfolio <onboarding@resend.dev>",
//       to: [config.email],
//       subject: `New Contact Message from ${zodData.fullName}`,
//       react: EmailTemplate({
//         fullName: zodData.fullName,
//         email: zodData.email,
//         message: zodData.message,
//       }),
//     });

//     if (ownerEmailError) {
//       console.error("Error sending owner email:", ownerEmailError);
//       return Response.json(
//         { error: "Failed to send notification email" },
//         { status: 500 }
//       );
//     }

//     /**
//      * Step 2: Send acknowledgement email to the sender
//      */
//     const { data: acknowledgementData, error: acknowledgementError } = await resend.emails.send({
//       from: "Portfolio <onboarding@resend.dev>",
//       to: [zodData.email],
//       subject: "Thank you for reaching out!",
//       react: AcknowledgementEmailTemplate({
//         fullName: zodData.fullName,
//         message: zodData.message,
//         portfolioOwnerName: config.author,
//       }),
//     });

//     if (acknowledgementError) {
//       console.error("Error sending acknowledgement email:", acknowledgementError);
//       // Still return success if owner email was sent, but log the error
//       console.warn("Acknowledgement email failed but owner notification succeeded");
//     }

//     // Return success response
//     return Response.json({
//       success: true,
//       message: "Emails sent successfully",
//       data: {
//         ownerEmail: ownerEmailData?.id,
//         acknowledgementEmail: acknowledgementData?.id,
//       },
//     });
//   } catch (error) {
//     console.error("API route error:", error);
//     return Response.json(
//       { error: error instanceof Error ? error.message : "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

import { EmailTemplate } from "@/components/email-template";
import { AcknowledgementEmailTemplate } from "@/components/email-acknowledgement";
import { config } from "@/data/config";
import { Resend } from "resend";
import { z } from "zod";
import { NextResponse } from "next/server";

const Email = z.object({
  fullName: z.string().min(2, "Full name is invalid!"),
  email: z.string().email({ message: "Email is invalid!" }),
  message: z.string().min(10, "Message is too short!"),
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const body = await req.json();

    const parsed = Email.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const { fullName, email, message } = parsed.data;

    // Send email to owner
    try {
      await resend.emails.send({
        from: "Portfolio <onboarding@resend.dev>",
        to: [config.email],
        subject: `New Contact Message from ${fullName}`,
        react: EmailTemplate({ fullName, email, message }),
      });
    } catch (err) {
      console.error("Error sending owner email:", err);
      return NextResponse.json({ error: "Failed to send notification email" }, { status: 500 });
    }

    // Send acknowledgement email to sender
    try {
      await resend.emails.send({
        from: "Portfolio <onboarding@resend.dev>",
        to: [email],
        subject: "Thank you for reaching out!",
        react: AcknowledgementEmailTemplate({ fullName, message, portfolioOwnerName: config.author }),
      });
    } catch (err) {
      console.error("Error sending acknowledgement email:", err);
      // Do not fail the request — just log
      console.warn("Acknowledgement email failed but owner notification succeeded");
    }

    return NextResponse.json({
      success: true,
      message: "Emails sent successfully",
    });

  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
