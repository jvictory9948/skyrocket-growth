import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetToken = crypto.randomUUID();
    const resetLink = `${redirectUrl}?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log("Sending password reset email to:", email);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Epik <noreply@plume-token.org>",
        to: [email],
        subject: "Reset Your Password - Epik",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 32px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">Reset Your Password</h1>
                        <p style="color: #a0a0a0; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                          We received a request to reset your password. Click the button below to create a new password.
                        </p>
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                          Reset Password
                        </a>
                        <p style="color: #666666; font-size: 13px; margin: 32px 0 0 0;">
                          If you didn't request this, you can safely ignore this email.
                        </p>
                        <p style="color: #444444; font-size: 12px; margin: 24px 0 0 0;">
                          This link expires in 1 hour.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    const responseData = await emailResponse.json();
    console.log("Resend API response:", responseData);

    if (!emailResponse.ok) {
      throw new Error(responseData.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
