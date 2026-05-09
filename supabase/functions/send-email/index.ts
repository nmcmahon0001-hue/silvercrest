import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    console.log("Hook payload received:", JSON.stringify(payload))

    const user = payload.user
    const emailData = payload.email_data

    if (!user || !emailData) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const userEmail = user.email
    const userName = user.user_metadata?.full_name || "Valued Customer"
    const actionType = emailData.email_action_type
    const tokenHash = emailData.token_hash
    const redirectTo = emailData.redirect_to || "https://silvercrestfin.com/verify.html"
    const siteUrl = "https://pxlaghpewiewiezsimpl.supabase.co/auth/v1"

    const confirmUrl = `${siteUrl}/verify?token=${tokenHash}&type=${actionType}&redirect_to=${encodeURIComponent(redirectTo)}`

    let subject = "SilverCrest — Action Required"
    let html = ""

    if (actionType === "signup" || actionType === "email_change") {
      subject = "Verify your SilverCrest account"
      html = buildVerificationEmail(userName, userEmail, confirmUrl)
    } else if (actionType === "recovery") {
      subject = "Reset your SilverCrest password"
      html = buildPasswordResetEmail(userName, confirmUrl)
    }

    console.log(`Sending ${actionType} email to ${userEmail}`)

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SilverCrest Financial <support@silvercrestfin.com>",
        to: [userEmail],
        subject: subject,
        html: html,
      }),
    })

    const resendData = await resendResponse.json()
    console.log("Resend API response:", JSON.stringify(resendData))

    if (!resendResponse.ok) {
      console.error("Resend error:", JSON.stringify(resendData))
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

function buildVerificationEmail(name: string, email: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Verify your SilverCrest account</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;background:#f0f4ff;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:24px;">
    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:12px 24px;">
        <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;font-family:Arial,sans-serif;">SilverCrest</span>
      </td></tr>
    </table>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(79,70,229,0.12);">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;">
        <div style="background:rgba(255,255,255,0.15);border-radius:20px;padding:16px 20px;display:inline-block;margin-bottom:16px;">
          <span style="font-size:36px;">✉️</span>
        </div>
        <h1 style="color:white;font-size:26px;font-weight:800;margin:0 0 8px;font-family:Arial,sans-serif;">Verify your email</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0;font-family:Arial,sans-serif;">You're almost ready to start banking</p>
      </td></tr>
    </table>

    <!-- Body -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px;">

        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 6px;font-family:Arial,sans-serif;">
          Hi <strong>${name}</strong>! 👋
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Arial,sans-serif;">
          Thank you for joining SilverCrest. Please verify your email address to activate your account and access your personal banking dashboard.
        </p>

        <!-- Button -->
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td align="center" style="padding-bottom:32px;">
            <a href="${url}"
              style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-size:16px;font-weight:700;padding:16px 48px;border-radius:14px;text-decoration:none;font-family:Arial,sans-serif;box-shadow:0 4px 16px rgba(79,70,229,0.35);">
              ✅ Verify My Email
            </a>
          </td></tr>
        </table>

        <!-- Steps box -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f8faff;border:1px solid #e0e7ff;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:24px;">
            <p style="color:#4f46e5;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-family:Arial,sans-serif;">
              What happens next
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:28px;vertical-align:top;padding-bottom:10px;">
                  <div style="width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">1</div>
                </td>
                <td style="padding-left:12px;padding-bottom:10px;vertical-align:top;">
                  <p style="color:#374151;font-size:14px;margin:0;line-height:1.5;font-family:Arial,sans-serif;"><strong>Click the button above</strong> to verify your email</p>
                </td>
              </tr>
              <tr>
                <td style="width:28px;vertical-align:top;padding-bottom:10px;">
                  <div style="width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">2</div>
                </td>
                <td style="padding-left:12px;padding-bottom:10px;vertical-align:top;">
                  <p style="color:#374151;font-size:14px;margin:0;line-height:1.5;font-family:Arial,sans-serif;"><strong>Complete identity verification</strong> on your dashboard</p>
                </td>
              </tr>
              <tr>
                <td style="width:28px;vertical-align:top;">
                  <div style="width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">3</div>
                </td>
                <td style="padding-left:12px;vertical-align:top;">
                  <p style="color:#374151;font-size:14px;margin:0;line-height:1.5;font-family:Arial,sans-serif;"><strong>Start banking</strong> — send money, buy crypto &amp; more!</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- Account details preview -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="color:#166534;font-size:13px;font-weight:700;margin:0 0 6px;font-family:Arial,sans-serif;">🎁 Your welcome package includes:</p>
            <p style="color:#15803d;font-size:13px;margin:0;line-height:1.7;font-family:Arial,sans-serif;">
              ✓ $1,000 welcome balance<br/>
              ✓ Free instant transfers<br/>
              ✓ Virtual debit card<br/>
              ✓ Crypto wallet access
            </p>
          </td></tr>
        </table>

        <!-- Warning -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:14px 16px;">
            <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;font-family:Arial,sans-serif;">
              ⚠️ Check your <strong>spam folder</strong> if you don't see this. Link expires in <strong>24 hours</strong>.
            </p>
          </td></tr>
        </table>

        <p style="color:#9ca3af;font-size:12px;line-height:1.7;margin:0;font-family:Arial,sans-serif;">
          If you didn't create a SilverCrest account, please ignore this email.<br/>
          Button not working? Copy this link:<br/>
          <a href="${url}" style="color:#4f46e5;font-size:11px;word-break:break-all;">${url}</a>
        </p>

      </td></tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:24px 40px;text-align:center;">
        <p style="color:#6b7280;font-size:13px;font-weight:700;margin:0 0 4px;font-family:Arial,sans-serif;">SilverCrest Financial</p>
        <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;font-family:Arial,sans-serif;">Secure · Fast · Modern Banking</p>
        <p style="margin:0;">
          <a href="mailto:support@silvercrestfin.com" style="color:#4f46e5;font-size:12px;text-decoration:none;font-family:Arial,sans-serif;">support@silvercrestfin.com</a>
          &nbsp;·&nbsp;
          <a href="https://silvercrestfin.com" style="color:#4f46e5;font-size:12px;text-decoration:none;font-family:Arial,sans-serif;">silvercrestfin.com</a>
        </p>
        <p style="color:#d1d5db;font-size:11px;margin:10px 0 0;font-family:Arial,sans-serif;">© 2026 SilverCrest. All rights reserved.</p>
      </td></tr>
    </table>

  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function buildPasswordResetEmail(name: string, url: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;background:#f0f4ff;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:white;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(79,70,229,0.12);">
  <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;">
    <h1 style="color:white;font-size:24px;font-weight:800;margin:0 0 8px;">Reset your password</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">SilverCrest Financial</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px;">Hi <strong>${name}</strong>!</p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">We received a request to reset your SilverCrest account password. Click below to set a new one.</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding-bottom:28px;">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-size:16px;font-weight:700;padding:16px 48px;border-radius:14px;text-decoration:none;">
          🔐 Reset Password
        </a>
      </td></tr>
    </table>
    <p style="color:#9ca3af;font-size:12px;line-height:1.7;margin:0;">
      If you didn't request this, you can safely ignore this email. This link expires in <strong>1 hour</strong>.<br/>
      <a href="${url}" style="color:#4f46e5;font-size:11px;word-break:break-all;">${url}</a>
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 SilverCrest Financial · <a href="mailto:support@silvercrestfin.com" style="color:#4f46e5;">support@silvercrestfin.com</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}