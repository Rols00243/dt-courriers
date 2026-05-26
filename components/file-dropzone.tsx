"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import imageCompression from "browser-image-compression"
import {
  Upload, FileText, X, Image as ImageIcon, FileScan, Loader2, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface DroppedFile {
  file: File
  ocrTexte?: string
  analyzed?: boolean
}

export interface AnalysisResult {
  objet: string
  type: string
  sens: string
  priorite: string
  expediteur: string
  destinataire: string
  dateDocument: string
  description: string
  confiance: number
}

export function FileDropzone({
  files,
  onChange,
  onOcrText,
  onAnalysis,
  enableOcr = true,
  enableAnalyze = true,
  enableCompression = true,
}: {
  files: DroppedFile[]
  onChange: (files: DroppedFile[]) => void
  onOcrText?: (text: string) => void
  onAnalysis?: (result: AnalysisResult) => void
  enableOcr?: boolean
  enableAnalyze?: boolean
  enableCompression?: boolean
}) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const processed: DroppedFile[] = []

      for (const f of accepted) {
        let finalFile = f
        if (enableCompression && f.type.startsWith("image/")) {
          setProcessing(`Compression de ${f.name}...`)
          try {
            finalFile = await imageCompression(f, {
              maxSizeMB: 2,
              maxWidthOrHeight: 2048,
              useWebWorker: true,
            })
          } catch {}
        }
        processed.push({ file: finalFile })
      }

      setProcessing(null)
      onChange([...files, ...processed])
    },
    [files, onChange, enableCompression]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  })

  function removeFile(idx: number) {
    onChange(files.filter((_, i) => i !== idx))
  }

  async function runOcr(idx: number) {
    const item = files[idx]
    if (!item.file.type.startsWith("image/")) return
    setError(null)
    setProcessing(`Analyse OCR de ${item.file.name}...`)
    try {
      const fd = new FormData()
      fd.append("file", item.file)
      const res = await fetch("/api/ocr", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        const updated = [...files]
        updated[idx] = { ...item, ocrTexte: data.text }
        onChange(updated)
        if (data.objet && onOcrText) onOcrText(data.objet)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Erreur OCR")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur OCR")
    }
    setProcessing(null)
  }

  async function runAnalysis(idx: number) {
    const item = files[idx]
    const supportedAnalysis =
      item.file.type === "application/pdf" || item.file.type.startsWith("image/")
    if (!supportedAnalysis || !onAnalysis) return

    setError(null)
    setProcessing(`Analyse IA de ${item.file.name}...`)

    try {
      const fd = new FormData()
      fd.append("file", item.file)
      const res = await fetch("/api/analyze", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'analyse")
        setProcessing(null)
        return
      }

      onAnalysis(data.data)

      const updated = [...files]
      updated[idx] = { ...item, analyzed: true }
      onChange(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse")
    }

    setProcessing(null)
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800"
          }`}
      >
        <input {...getInputProps()} />
        <Upload className={`h-10 w-10 mb-2 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
        {isDragActive ? (
          <p className="text-sm font-medium text-blue-600">Déposez les fichiers ici...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-xs text-gray-500 mt-1">ou cliquez pour parcourir</p>
            <p className="text-xs text-gray-400 mt-2">PDF, Word, Images (compression auto)</p>
          </>
        )}
      </div>

      {processing && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 px-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {processing}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 px-2 py-1.5 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((item, i) => {
            const isImg = item.file.type.startsWith("image/")
            const isPdf = item.file.type === "application/pdf"
            const canAnalyze = isPdf || isImg
            return (
              <div
                key={i}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex-wrap"
              >
                {isImg ? (
                  <ImageIcon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-[150px]">
                  {item.file.name}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {(item.file.size / 1024).toFixed(0)} KB
                </span>
                {item.ocrTexte && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  >
                    OCR ✓
                  </Badge>
                )}
                {item.analyzed && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    IA ✓
                  </Badge>
                )}
                {enableAnalyze && canAnalyze && (
                  <Button
                    type="button"
                    size="sm"
                    variant={item.analyzed ? "ghost" : "default"}
                    className={
                      item.analyzed
                        ? "h-7 px-2 text-xs gap-1"
                        : "h-7 px-2 text-xs gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    }
                    onClick={() => runAnalysis(i)}
                    disabled={processing !== null}
                  >
                    <Sparkles className="h-3 w-3" />
                    {item.analyzed ? "Ré-analyser" : "Analyser"}
                  </Button>
                )}
                {enableOcr && isImg && !item.ocrTexte && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => runOcr(i)}
                    disabled={processing !== null}
                  >
                    <FileScan className="h-3 w-3" />
                    OCR
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500"
                  disabled={processing !== null}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
