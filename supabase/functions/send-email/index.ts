import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!
serve(async (req: Request) => {
  try {
    const payload = await req.json()
    console.log("Payload type:", payload.type)

    // ── WELCOME EMAIL (called from verify.html) ──
    if (payload.type === "welcome") {
      const { email, full_name, account_number } = payload
      const html = buildWelcomeEmail(full_name, email, account_number, "082637291")

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "SilverCrest Financial <support@silvercrestfin.com>",
          to: [email],
          subject: `Welcome to SilverCrest, ${full_name}! 🎉`,
          html,
        }),
      })

      const data = await res.json()
      console.log("Welcome email response:", JSON.stringify(data))
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    // ── AUTH HOOK EMAILS (verification, password reset) ──
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SilverCrest Financial <support@silvercrestfin.com>",
        to: [userEmail],
        subject,
        html,
      }),
    })

    const data = await res.json()
    console.log("Auth email response:", JSON.stringify(data))

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

// ── WELCOME EMAIL ─────────────────────────────────────────
function buildWelcomeEmail(
  name: string,
  email: string,
  accountNumber: string,
  routingNumber: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Welcome to SilverCrest</title>
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

    <!-- Purple header with celebration -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:48px 40px;text-align:center;">
        <div style="font-size:56px;margin-bottom:16px;">🎉</div>
        <h1 style="color:white;font-size:28px;font-weight:800;margin:0 0 8px;font-family:Arial,sans-serif;letter-spacing:-0.5px;">
          Welcome to SilverCrest!
        </h1>
        <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;font-family:Arial,sans-serif;">
          Your account is verified and ready to use
        </p>
      </td></tr>
    </table>

    <!-- Body -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px;">

        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 6px;font-family:Arial,sans-serif;">
          Hi <strong>${name}</strong>! 👋
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Arial,sans-serif;">
          Your email has been verified and your SilverCrest account is now fully active. Here are your account details — keep them safe!
        </p>

        <!-- Account Details Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:20px;margin-bottom:28px;">
          <tr><td style="padding:28px;">
            <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 20px;font-family:Arial,sans-serif;">
              Your Account Details
            </p>

            <!-- Account Holder -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td>
                  <p style="color:rgba(255,255,255,0.65);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;font-family:Arial,sans-serif;">Account Holder</p>
                  <p style="color:white;font-size:16px;font-weight:700;margin:0;font-family:Arial,sans-serif;">${name}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="4">
              <!-- Account Number -->
              <tr>
                <td style="padding-bottom:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background:rgba(255,255,255,0.12);border-radius:12px;">
                    <tr><td style="padding:14px 16px;">
                      <p style="color:rgba(255,255,255,0.65);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;font-family:Arial,sans-serif;">Account Number</p>
                      <p style="color:white;font-size:20px;font-weight:800;margin:0;font-family:'Courier New',monospace;letter-spacing:3px;">${accountNumber}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <!-- Routing Number -->
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background:rgba(255,255,255,0.12);border-radius:12px;">
                    <tr><td style="padding:14px 16px;">
                      <p style="color:rgba(255,255,255,0.65);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;font-family:Arial,sans-serif;">Routing Number (Wire Transfers)</p>
                      <p style="color:white;font-size:20px;font-weight:800;margin:0;font-family:'Courier New',monospace;letter-spacing:3px;">${routingNumber}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- Welcome balance -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="color:#166534;font-size:13px;font-weight:700;margin:0 0 4px;font-family:Arial,sans-serif;">🎁 Welcome Bonus</p>
                  <p style="color:#15803d;font-size:13px;margin:0;font-family:Arial,sans-serif;">We've added <strong>$1,000.00</strong> to your account to get you started!</p>
                </td>
                <td style="text-align:right;white-space:nowrap;padding-left:16px;">
                  <p style="color:#15803d;font-size:24px;font-weight:800;margin:0;font-family:Arial,sans-serif;">$1,000</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- What you can do -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f8faff;border:1px solid #e0e7ff;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:24px;">
            <p style="color:#4f46e5;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;font-family:Arial,sans-serif;">
              What you can do with SilverCrest
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;">
                        <div style="width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:white;font-size:12px;">✓</div>
                      </td>
                      <td style="padding-left:10px;">
                        <p style="color:#374151;font-size:14px;margin:0;font-family:Arial,sans-serif;"><strong>Send money instantly</strong> to any SilverCrest user</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;">
                        <div style="width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:white;font-size:12px;">✓</div>
                      </td>
                      <td style="padding-left:10px;">
                        <p style="color:#374151;font-size:14px;margin:0;font-family:Arial,sans-serif;"><strong>Buy and sell crypto</strong> — Bitcoin, Ethereum, Solana and more</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;">
                        <div style="width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:white;font-size:12px;">✓</div>
                      </td>
                      <td style="padding-left:10px;">
                        <p style="color:#374151;font-size:14px;margin:0;font-family:Arial,sans-serif;"><strong>Pay bills</strong> — electricity, internet, airtime and more</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;">
                        <div style="width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:white;font-size:12px;">✓</div>
                      </td>
                      <td style="padding-left:10px;">
                        <p style="color:#374151;font-size:14px;margin:0;font-family:Arial,sans-serif;"><strong>Apply for loans</strong> — personal, business or mortgage</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- Next step: KYC -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;margin-bottom:28px;">
          <tr><td style="padding:20px;">
            <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 6px;font-family:Arial,sans-serif;">
              ⚡ Next step: Verify your identity
            </p>
            <p style="color:#92400e;font-size:13px;margin:0 0 12px;line-height:1.6;font-family:Arial,sans-serif;">
              To unlock full banking features including sending money, complete your identity verification (KYC). It takes less than 2 minutes.
            </p>
            <a href="https://silvercrestfin.com/kyc.html"
              style="display:inline-block;background:#d97706;color:white;font-size:13px;font-weight:700;padding:10px 20px;border-radius:10px;text-decoration:none;font-family:Arial,sans-serif;">
              Complete KYC →
            </a>
          </td></tr>
        </table>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td align="center" style="padding-bottom:24px;">
            <a href="https://silvercrestfin.com/dashboard.html"
              style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-size:16px;font-weight:700;padding:16px 48px;border-radius:14px;text-decoration:none;font-family:Arial,sans-serif;box-shadow:0 4px 16px rgba(79,70,229,0.35);">
              Go to My Dashboard →
            </a>
          </td></tr>
        </table>

        <p style="color:#9ca3af;font-size:12px;line-height:1.7;margin:0;font-family:Arial,sans-serif;">
          Keep your account details safe and never share them with anyone. SilverCrest will never ask for your password.<br/><br/>
          If you have any questions, contact us at
          <a href="mailto:support@silvercrestfin.com" style="color:#4f46e5;">support@silvercrestfin.com</a>
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

// ── VERIFICATION EMAIL ────────────────────────────────────
function buildVerificationEmail(name: string, email: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;background:#f0f4ff;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td align="center" style="padding-bottom:24px;">
    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:12px 24px;">
        <span style="color:white;font-size:22px;font-weight:800;font-family:Arial,sans-serif;">SilverCrest</span>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(79,70,229,0.12);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;">
        <div style="background:rgba(255,255,255,0.15);border-radius:20px;padding:16px 20px;display:inline-block;margin-bottom:16px;">
          <span style="font-size:36px;">✉️</span>
        </div>
        <h1 style="color:white;font-size:26px;font-weight:800;margin:0 0 8px;font-family:Arial,sans-serif;">Verify your email</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0;font-family:Arial,sans-serif;">You're almost ready to start banking</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px;">
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 6px;font-family:Arial,sans-serif;">Hi <strong>${name}</strong>! 👋</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Arial,sans-serif;">
          Thank you for joining SilverCrest. Please verify your email to activate your account.
        </p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td align="center" style="padding-bottom:32px;">
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-size:16px;font-weight:700;padding:16px 48px;border-radius:14px;text-decoration:none;font-family:Arial,sans-serif;">
              ✅ Verify My Email
            </a>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:14px 16px;">
            <p style="color:#92400e;font-size:13px;margin:0;font-family:Arial,sans-serif;">
              ⚠️ Check your <strong>spam folder</strong> if needed. Link expires in <strong>24 hours</strong>.
            </p>
          </td></tr>
        </table>
        <p style="color:#9ca3af;font-size:12px;margin:0;font-family:Arial,sans-serif;">
          Didn't create this account? Ignore this email.<br/>
          <a href="${url}" style="color:#4f46e5;font-size:11px;word-break:break-all;">${url}</a>
        </p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:24px 40px;text-align:center;">
        <p style="color:#6b7280;font-size:13px;font-weight:700;margin:0 0 4px;font-family:Arial,sans-serif;">SilverCrest Financial</p>
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

// ── PASSWORD RESET EMAIL ──────────────────────────────────
function buildPasswordResetEmail(name: string, url: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:white;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(79,70,229,0.12);">
  <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;">
    <h1 style="color:white;font-size:24px;font-weight:800;margin:0 0 8px;font-family:Arial,sans-serif;">Reset your password</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;font-family:Arial,sans-serif;">SilverCrest Financial</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px;font-family:Arial,sans-serif;">Hi <strong>${name}</strong>!</p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Arial,sans-serif;">We received a request to reset your SilverCrest password. Click below to set a new one.</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding-bottom:28px;">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-size:16px;font-weight:700;padding:16px 48px;border-radius:14px;text-decoration:none;font-family:Arial,sans-serif;">
          🔐 Reset Password
        </a>
      </td></tr>
    </table>
    <p style="color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">
      Didn't request this? Ignore this email. Link expires in <strong>1 hour</strong>.<br/>
      <a href="${url}" style="color:#4f46e5;font-size:11px;word-break:break-all;">${url}</a>
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0;font-family:Arial,sans-serif;">© 2026 SilverCrest · <a href="mailto:support@silvercrestfin.com" style="color:#4f46e5;">support@silvercrestfin.com</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}