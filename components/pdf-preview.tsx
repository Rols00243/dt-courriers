"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Download } from "lucide-react"
import Image from "next/image"

export function FilePreview({
  url,
  nom,
  type,
}: {
  url: string
  nom: string
  type: string
}) {
  const [open, setOpen] = useState(false)
  const isPdf = type === "application/pdf" || nom.toLowerCase().endsWith(".pdf")
  const isImg = type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(nom)

  if (!isPdf && !isImg) {
    return (
      <a href={url} download={nom} target="_blank" rel="noreferrer">
        <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
          <Download className="h-4 w-4" />
          Télécharger
        </Button>
      </a>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-blue-600"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" />
        Aperçu
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{nom}</span>
              <a href={url} download={nom} target="_blank" rel="noreferrer" className="ml-4">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </Button>
              </a>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
            {isPdf ? (
              <iframe src={url} className="w-full h-full" title={nom} />
            ) : (
              <div className="flex items-center justify-center p-4 h-full">
                <Image
                  src={url}
                  alt={nom}
                  width={1200}
                  height={800}
                  unoptimized
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
