"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface Comment {
  id: string
  contenu: string
  createdAt: string
  author: { name: string | null; email: string; role: string }
}

export function CommentsSection({ courrierId, locked }: { courrierId: string; locked: boolean }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/comments?courrierId=${courrierId}`)
      .then((r) => r.json())
      .then((d) => { setComments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courrierId])

  async function submit() {
    if (!text.trim()) return
    setPosting(true)
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courrierId, contenu: text.trim() }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments([c, ...comments])
      setText("")
    }
    setPosting(false)
  }

  return (
    <div className="space-y-4">
      {!locked && (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un commentaire..."
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={submit}
              disabled={!text.trim() || posting}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Commenter
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun commentaire</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                  {c.author.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{c.author.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(c.createdAt), { locale: fr, addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{c.contenu}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
