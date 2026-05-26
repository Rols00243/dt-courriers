import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import OpenAI from "openai"

export const maxDuration = 120

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    objet: {
      type: "string",
      description: "L'objet ou titre principal du courrier, en une phrase courte (max 200 caractères)",
    },
    type: {
      type: "string",
      enum: [
        "COURRIER_ENTRANT",
        "COURRIER_SORTANT",
        "COURRIER_INTERNE",
        "PV_COMMISSION",
        "ORDRE_MISSION",
        "RAPPORT_SEMESTRIEL",
        "RAPPORT_ANNUEL",
        "DOCUMENT_OFFICIEL",
      ],
      description:
        "Type de document. PV_COMMISSION pour procès-verbaux. ORDRE_MISSION pour ordres de mission. RAPPORT_SEMESTRIEL/ANNUEL pour rapports périodiques. DOCUMENT_OFFICIEL pour contrats/actes. Sinon courrier ENTRANT/SORTANT/INTERNE selon contexte.",
    },
    sens: {
      type: "string",
      enum: ["ENTRANT", "SORTANT", "INTERNE"],
      description: "Sens du courrier vis-à-vis de l'institution destinataire",
    },
    priorite: {
      type: "string",
      enum: ["BASSE", "NORMALE", "URGENTE", "TRES_URGENTE"],
      description:
        "Priorité détectée. URGENTE si 'urgent' ou délai serré. TRES_URGENTE si 'très urgent'. NORMALE par défaut.",
    },
    niveauAcces: {
      type: "string",
      enum: ["PUBLIC", "INTERNE", "CONFIDENTIEL", "SECRET"],
      description:
        "Niveau de confidentialité détecté dans l'en-tête ou les mentions. PUBLIC = pour diffusion. INTERNE = personnel de l'organisation (défaut). CONFIDENTIEL si mention 'Confidentiel' ou 'À usage restreint'. SECRET si 'Secret' ou 'Top secret'.",
    },
    expediteur: {
      type: "string",
      description: "Nom de la personne, du service ou de l'organisation qui envoie le courrier",
    },
    destinataire: {
      type: "string",
      description: "Nom de la personne, du service ou de l'organisation qui reçoit le courrier",
    },
    dateDocument: {
      type: "string",
      description: "Date du document au format ISO YYYY-MM-DD. Si aucune date trouvée, utilise la date du jour.",
    },
    description: {
      type: "string",
      description: "Résumé du contenu en 2-3 phrases maximum, en français, factuel et précis",
    },
    confiance: {
      type: "number",
      description: "Niveau de confiance global de l'extraction entre 0 et 1",
    },
  },
  required: [
    "objet",
    "type",
    "sens",
    "priorite",
    "niveauAcces",
    "expediteur",
    "destinataire",
    "dateDocument",
    "description",
    "confiance",
  ],
  additionalProperties: false,
}

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de courriers administratifs francophones.

Ta mission : extraire avec précision les informations structurées d'un document (PV de commission, ordre de mission, rapport, courrier entrant/sortant, document officiel, etc.) pour pré-remplir un formulaire d'enregistrement de courrier.

Le document peut être :
- un PDF avec du texte intégré
- un PDF scanné (image numérisée)
- une image (JPG, PNG, scan)

Dans tous les cas, utilise ta vision et ta capacité de lecture pour extraire l'information visible.

Règles d'extraction :
- Sois factuel et précis : n'invente JAMAIS d'informations absentes du document
- Si une information est ambiguë ou absente, fais la meilleure inférence possible et baisse le niveau de confiance
- Pour les dates : convertis tous formats français (15 mars 2026, 15/03/2026) en ISO (2026-03-15). Si aucune date, utilise la date du jour.
- Pour le type : utilise les indices contextuels (en-tête "Procès-verbal", "Ordre de mission", "Rapport annuel", etc.)
- Pour l'expéditeur/destinataire : extrais le NOM ou L'ENTITÉ, pas une adresse complète
- L'objet doit être court et synthétique, pas une copie de la ligne complète du document
- Pour la priorité : reste NORMALE sauf indication explicite`

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Clé API OpenAI non configurée. Ajoutez OPENAI_API_KEY dans le fichier .env",
      },
      { status: 500 }
    )
  }

  const fd = await req.formData()
  const file = fd.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type
  const base64 = buffer.toString("base64")
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let inputContent: OpenAI.Responses.ResponseInputContent[]

  if (mimeType === "application/pdf") {
    inputContent = [
      {
        type: "input_file",
        filename: file.name || "document.pdf",
        file_data: `data:application/pdf;base64,${base64}`,
      },
      {
        type: "input_text",
        text: "Analyse ce courrier (texte ou scan) et extrais les informations structurées.",
      },
    ]
  } else if (mimeType.startsWith("image/")) {
    const supported = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!supported.includes(mimeType)) {
      return NextResponse.json(
        { error: `Format image non supporté: ${mimeType}` },
        { status: 400 }
      )
    }
    inputContent = [
      {
        type: "input_image",
        image_url: `data:${mimeType};base64,${base64}`,
        detail: "high",
      },
      {
        type: "input_text",
        text: "Analyse ce courrier scanné et extrais les informations structurées.",
      },
    ]
  } else {
    return NextResponse.json(
      {
        error: `Type de fichier non supporté: ${mimeType}. Utilisez PDF, JPEG, PNG, WebP ou GIF.`,
      },
      { status: 400 }
    )
  }

  try {
    const response = await client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: [{ role: "user", content: inputContent }],
      text: {
        format: {
          type: "json_schema",
          name: "analyse_courrier",
          schema: ANALYSIS_SCHEMA,
          strict: true,
        },
      },
      max_output_tokens: 2048,
    })

    const outputText = response.output_text
    if (!outputText) {
      throw new Error("Aucune réponse de l'API OpenAI")
    }

    const data = JSON.parse(outputText)

    return NextResponse.json({
      success: true,
      data,
      model,
      usage: {
        input_tokens: response.usage?.input_tokens ?? 0,
        output_tokens: response.usage?.output_tokens ?? 0,
      },
    })
  } catch (e: unknown) {
    console.error("Analyse error:", e)
    if (e instanceof OpenAI.AuthenticationError) {
      return NextResponse.json(
        { error: "Clé OpenAI invalide. Vérifiez OPENAI_API_KEY." },
        { status: 401 }
      )
    }
    if (e instanceof OpenAI.RateLimitError) {
      return NextResponse.json(
        { error: "Trop de requêtes vers OpenAI. Réessayez dans un moment." },
        { status: 429 }
      )
    }
    if (e instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Erreur OpenAI: ${e.message}` },
        { status: e.status ?? 500 }
      )
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur inconnue" },
      { status: 500 }
    )
  }
}
