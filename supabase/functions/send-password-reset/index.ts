import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const resend = new Resend(resendApiKey);

    console.log("Checking if user exists for:", email);

    // Check if user exists (don't reveal if they don't)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      // Return success anyway to not reveal user existence
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a password reset email has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userExists = users.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      console.log("User not found, returning generic success");
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a password reset email has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a custom token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    console.log("Storing password reset token for:", email);

    // Delete any existing tokens for this email
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("email", email.toLowerCase());

    // Store the token in the database
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        email: email.toLowerCase(),
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing token:", insertError);
      throw new Error("Failed to create reset token");
    }

    // Build the reset link with the custom token
    const resetLink = `${redirectUrl}?token=${token}`;
    console.log("Reset link generated successfully");

    // Send custom email via Resend
    const emailResponse = await resend.emails.send({
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
    });

    console.log("Email sent via Resend:", emailResponse);

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
