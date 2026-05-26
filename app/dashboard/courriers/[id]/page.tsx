import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, FileText, Edit, Calendar, User, Building,
  Download, Lock, QrCode,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  STATUT_LABELS, STATUT_COLORS, TYPE_LABELS,
  PRIORITE_LABELS, PRIORITE_COLORS, SENS_LABELS,
  NIVEAU_ACCES_LABELS, NIVEAU_ACCES_COLORS,
} from "@/lib/constants"
import { StatutSelector } from "./statut-selector"
import { CommentsSection } from "@/components/comments-section"
import { HistorySection } from "@/components/history-section"
import { LockToggle } from "@/components/lock-toggle"
import { FilePreview } from "@/components/pdf-preview"

export default async function CourrierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const courrier = await prisma.courrier.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      fichiers: true,
    },
  })

  if (!courrier) notFound()

  const isAdmin = session?.user.role === "ADMIN"
  const locked = courrier.verrouille

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/courriers">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {locked && <Lock className="h-4 w-4 text-amber-600" />}
              <h1 className="text-xl font-bold">{courrier.objet}</h1>
            </div>
            <p className="text-sm text-gray-500 font-mono">{courrier.numero}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export/${id}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </a>
          <LockToggle courrierId={id} locked={locked} canUnlock={isAdmin} />
          {!locked && (
            <Link href={`/dashboard/courriers/${id}/modifier`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Détails du courrier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={STATUT_COLORS[courrier.statut]} variant="outline">
                  {STATUT_LABELS[courrier.statut]}
                </Badge>
                <Badge className={PRIORITE_COLORS[courrier.priorite]} variant="outline">
                  {PRIORITE_LABELS[courrier.priorite]}
                </Badge>
                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                  {SENS_LABELS[courrier.sens]}
                </Badge>
                <Badge className={NIVEAU_ACCES_COLORS[courrier.niveauAcces]} variant="outline">
                  {NIVEAU_ACCES_LABELS[courrier.niveauAcces]}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Type</p>
                  <p className="font-medium mt-1">{TYPE_LABELS[courrier.type]}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">N° Référence</p>
                  <p className="font-mono font-medium mt-1 text-blue-600 dark:text-blue-400">{courrier.numero}</p>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Expéditeur</p>
                    <p className="font-medium mt-1">{courrier.expediteur}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Destinataire</p>
                    <p className="font-medium mt-1">{courrier.destinataire}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Date du document</p>
                    <p className="font-medium mt-1">
                      {format(new Date(courrier.dateDocument), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
                {courrier.dateReception && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider">Date de réception</p>
                      <p className="font-medium mt-1">
                        {format(new Date(courrier.dateReception), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {courrier.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{courrier.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {courrier.fichiers.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Pièces jointes ({courrier.fichiers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {courrier.fichiers.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.nom}</p>
                        <p className="text-xs text-gray-400">
                          {(f.taille / 1024).toFixed(0)} KB
                          {f.ocrTexte && <span className="ml-2 text-green-600 dark:text-green-400">· OCR disponible</span>}
                        </p>
                      </div>
                    </div>
                    <FilePreview url={f.url} nom={f.nom} type={f.type} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Commentaires</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsSection courrierId={id} locked={locked} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {!locked && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Changer le statut</CardTitle>
              </CardHeader>
              <CardContent>
                <StatutSelector courrierId={courrier.id} currentStatut={courrier.statut} />
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <Image
                src={`/api/qrcode/${id}`}
                alt="QR Code"
                width={160}
                height={160}
                unoptimized
                className="rounded border border-gray-200 dark:border-gray-700 p-1 bg-white"
              />
              <p className="text-xs text-gray-500 text-center">
                Scanner pour accéder rapidement
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Créé par</p>
                <p className="font-medium">{courrier.createdBy.name}</p>
                <p className="text-gray-400 text-xs">{courrier.createdBy.email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-400 text-xs">Créé le</p>
                <p className="font-medium">
                  {format(new Date(courrier.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Modifié le</p>
                <p className="font-medium">
                  {format(new Date(courrier.updatedAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <HistorySection courrierId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
