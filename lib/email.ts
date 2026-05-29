import "server-only"
import { Resend } from "resend"

/**
 * Service email basé sur Resend (https://resend.com).
 *
 * Configuration nécessaire :
 * - RESEND_API_KEY : clé API depuis resend.com/api-keys
 * - EMAIL_FROM : adresse d'envoi (ex: "DT Courriers <notifications@votredomaine.com>")
 *   Sans domaine personnel vérifié, utilisez l'adresse de test "onboarding@resend.dev".
 *
 * Si RESEND_API_KEY n'est pas configurée, sendEmail() devient un no-op
 * (log dans la console, pas d'erreur) pour ne pas bloquer l'application.
 */

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM || "DT Courriers <onboarding@resend.dev>"

export interface EmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!resend) {
    console.log(
      `[email] Resend non configuré (RESEND_API_KEY manquant) — email à ${params.to} non envoyé : "${params.subject}"`
    )
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })
    if (error) {
      console.error("[email] Erreur Resend :", error)
      return false
    }
    return true
  } catch (e) {
    console.error("[email] Exception :", e)
    return false
  }
}

/* ───────────────────────── Templates HTML ───────────────────────── */

const BASE_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f9fafb; margin: 0; padding: 24px; }
  .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; }
  h1 { color: #2563eb; font-size: 20px; margin: 0 0 16px; }
  .meta { color: #6b7280; font-size: 14px; }
  .btn { display: inline-block; background: #2563eb; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
`

function wrap(title: string, body: string, ctaLabel?: string, ctaUrl?: string) {
  const button = ctaLabel && ctaUrl ? `<a class="btn" href="${ctaUrl}">${ctaLabel}</a>` : ""
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>${BASE_STYLE}</style></head>
<body><div class="container">
<h1>${title}</h1>
${body}
${button}
<p class="footer">— DT Courriers · système automatisé, ne pas répondre</p>
</div></body></html>`
}

export function emailCommentaire(opts: {
  to: string
  destinataireName: string
  auteurName: string
  courrierNumero: string
  courrierObjet: string
  contenu: string
  courrierUrl: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `[DT Courriers] Nouveau commentaire sur ${opts.courrierNumero}`,
    html: wrap(
      `Nouveau commentaire`,
      `<p>Bonjour ${opts.destinataireName},</p>
       <p><strong>${opts.auteurName}</strong> a commenté le courrier <strong>${opts.courrierNumero}</strong> — <em>${opts.courrierObjet}</em> :</p>
       <blockquote style="border-left:3px solid #2563eb;padding:8px 12px;color:#374151;background:#f3f4f6;border-radius:4px;">${opts.contenu}</blockquote>`,
      "Ouvrir le courrier",
      opts.courrierUrl
    ),
  })
}

export function emailCourrierUrgent(opts: {
  to: string
  destinataireName: string
  numero: string
  objet: string
  expediteur: string
  priorite: string
  courrierUrl: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `[DT Courriers] 🔴 ${opts.priorite} — ${opts.numero}`,
    html: wrap(
      `Courrier ${opts.priorite.toLowerCase()}`,
      `<p>Bonjour ${opts.destinataireName},</p>
       <p>Un courrier de priorité <strong>${opts.priorite}</strong> a été enregistré :</p>
       <p class="meta"><strong>${opts.numero}</strong> — ${opts.objet}<br>Expéditeur : ${opts.expediteur}</p>`,
      "Voir le courrier",
      opts.courrierUrl
    ),
  })
}

export function emailNouveauCompte(opts: {
  to: string
  name: string
  email: string
  password: string
  loginUrl: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `[DT Courriers] Votre compte a été créé`,
    html: wrap(
      `Bienvenue dans DT Courriers`,
      `<p>Bonjour ${opts.name},</p>
       <p>Un compte a été créé pour vous. Voici vos identifiants :</p>
       <p class="meta"><strong>Email :</strong> ${opts.email}<br>
       <strong>Mot de passe temporaire :</strong> <code>${opts.password}</code></p>
       <p>Pensez à changer votre mot de passe à la première connexion depuis la page <em>Mon profil</em>.</p>`,
      "Se connecter",
      opts.loginUrl
    ),
  })
}
