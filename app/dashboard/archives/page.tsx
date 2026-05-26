import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Archive, Lock, PlusCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { TYPE_LABELS } from "@/lib/constants"

export default async function ArchivesPage() {
  const archives = await prisma.courrier.findMany({
    where: { statut: "ARCHIVE" },
    orderBy: { updatedAt: "desc" },
    include: { fichiers: true },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
            <Archive className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Archives</h1>
            <p className="text-gray-500 text-sm">{archives.length} document(s) archivé(s)</p>
          </div>
        </div>
        <Link href="/dashboard/archives/nouveau">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2">
            <PlusCircle className="h-4 w-4" />
            Archiver un document
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="font-semibold">N° Référence</TableHead>
                <TableHead className="font-semibold">Objet</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Expéditeur</TableHead>
                <TableHead className="font-semibold">Archivé le</TableHead>
                <TableHead className="font-semibold">Pièces</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    Aucun document archivé
                  </TableCell>
                </TableRow>
              ) : (
                archives.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="font-mono text-sm text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-1.5">
                        {c.verrouille && <Lock className="h-3 w-3 text-amber-600" />}
                        {c.numero}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[220px] truncate">{c.objet}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">{TYPE_LABELS[c.type]}</TableCell>
                    <TableCell className="text-sm">{c.expediteur}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(c.updatedAt), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{c.fichiers.length}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/courriers/${c.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
