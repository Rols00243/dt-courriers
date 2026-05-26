"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  UserPlus, KeyRound, Trash2, Edit, Shield, ShieldCheck,
  CheckCircle2, XCircle, Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  NIVEAU_ACCES_LABELS, NIVEAU_ACCES_COLORS, ROLE_LABELS,
} from "@/lib/constants"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  niveauAcces: string
  peutGererUtilisateurs: boolean
  actif: boolean
  createdAt: string
  _count: { courriers: number }
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  GESTIONNAIRE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  AGENT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "AGENT",
  niveauAcces: "INTERNE",
  peutGererUtilisateurs: false,
}

export function UtilisateursClient({
  initialUsers,
  myId,
  myRole,
}: {
  initialUsers: User[]
  myId: string
  myRole: string
}) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [createForm, setCreateForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [newPassword, setNewPassword] = useState("")

  const isAdmin = myRole === "ADMIN"

  function notify(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3500)
  }

  async function refresh() {
    const res = await fetch("/api/utilisateurs", { cache: "no-store" })
    if (res.ok) setUsers(await res.json())
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    if (res.ok) {
      setCreateOpen(false)
      setCreateForm(emptyForm)
      notify("Compte créé")
      await refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? "Erreur")
    }
    setLoading(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setLoading(true)
    setError("")
    const res = await fetch(`/api/utilisateurs/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        niveauAcces: editForm.niveauAcces,
        peutGererUtilisateurs: editForm.peutGererUtilisateurs,
      }),
    })
    if (res.ok) {
      setEditOpen(false)
      setEditingUser(null)
      notify("Compte modifié")
      await refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? "Erreur")
    }
    setLoading(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setLoading(true)
    setError("")
    const res = await fetch(`/api/utilisateurs/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    })
    if (res.ok) {
      setPwdOpen(false)
      setNewPassword("")
      notify(`Mot de passe réinitialisé pour ${editingUser.email}`)
      setEditingUser(null)
    } else {
      const d = await res.json()
      setError(d.error ?? "Erreur")
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!editingUser) return
    setLoading(true)
    setError("")
    const res = await fetch(`/api/utilisateurs/${editingUser.id}`, { method: "DELETE" })
    if (res.ok) {
      setDeleteOpen(false)
      notify(`Compte ${editingUser.email} supprimé`)
      setEditingUser(null)
      await refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? "Erreur")
    }
    setLoading(false)
  }

  async function toggleActif(u: User) {
    await fetch(`/api/utilisateurs/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !u.actif }),
    })
    notify(u.actif ? "Compte désactivé" : "Compte réactivé")
    await refresh()
  }

  function openEdit(u: User) {
    setEditingUser(u)
    setEditForm({
      name: u.name ?? "",
      email: u.email,
      password: "",
      role: u.role,
      niveauAcces: u.niveauAcces,
      peutGererUtilisateurs: u.peutGererUtilisateurs,
    })
    setError("")
    setEditOpen(true)
  }

  function openPwd(u: User) {
    setEditingUser(u)
    setNewPassword("")
    setError("")
    setPwdOpen(true)
  }

  function openDelete(u: User) {
    setEditingUser(u)
    setError("")
    setDeleteOpen(true)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            {successMsg}
          </div>
        )}
        <Button
          className="ml-auto bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={() => { setCreateForm(emptyForm); setError(""); setCreateOpen(true) }}
        >
          <UserPlus className="h-4 w-4" />
          Nouveau compte
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="font-semibold">Nom</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Rôle</TableHead>
                <TableHead className="font-semibold">Niveau d&apos;accès</TableHead>
                <TableHead className="font-semibold text-center">Gestion comptes</TableHead>
                <TableHead className="font-semibold text-center">Actif</TableHead>
                <TableHead className="font-semibold text-center">Courriers</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className={!u.actif ? "opacity-50" : ""}>
                  <TableCell className="font-medium">
                    {u.name}
                    {u.id === myId && <span className="text-xs text-blue-500 ml-2">(vous)</span>}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[u.role]} variant="outline">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={NIVEAU_ACCES_COLORS[u.niveauAcces]} variant="outline">
                      {NIVEAU_ACCES_LABELS[u.niveauAcces] ?? u.niveauAcces}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {u.peutGererUtilisateurs ? (
                      <ShieldCheck className="h-4 w-4 text-green-600 inline" />
                    ) : (
                      <Shield className="h-4 w-4 text-gray-300 dark:text-gray-600 inline" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {u.actif ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 inline" />
                    )}
                  </TableCell>
                  <TableCell className="text-center text-gray-600 dark:text-gray-400">{u._count.courriers}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        title="Modifier"
                        onClick={() => openEdit(u)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        title="Réinitialiser mot de passe"
                        onClick={() => openPwd(u)}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        title={u.actif ? "Désactiver" : "Réactiver"}
                        className={u.actif ? "text-orange-600" : "text-green-600"}
                        onClick={() => toggleActif(u)}
                        disabled={u.id === myId}
                      >
                        {u.actif ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        title="Supprimer"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => openDelete(u)}
                        disabled={u.id === myId}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Création */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau compte utilisateur</DialogTitle>
            <DialogDescription>
              Le compte recevra ses identifiants à la première connexion.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label>Nom complet *</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
            </div>
            <div>
              <Label>Mot de passe * (min 6 caractères)</Label>
              <Input type="text" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rôle</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v ?? "AGENT" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="GESTIONNAIRE">Gestionnaire</SelectItem>
                    {isAdmin && <SelectItem value="ADMIN">Administrateur</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Niveau d&apos;accès</Label>
                <Select value={createForm.niveauAcces} onValueChange={(v) => setCreateForm({ ...createForm, niveauAcces: v ?? "INTERNE" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="INTERNE">Interne</SelectItem>
                    <SelectItem value="CONFIDENTIEL">Confidentiel</SelectItem>
                    <SelectItem value="SECRET">Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isAdmin && (
              <label className="flex items-start gap-2 text-sm bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.peutGererUtilisateurs}
                  onChange={(e) => setCreateForm({ ...createForm, peutGererUtilisateurs: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Déléguer la gestion des comptes</span>
                  <br />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Cet utilisateur pourra créer, modifier et supprimer d&apos;autres comptes (sauf les ADMIN).
                  </span>
                </span>
              </label>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer le compte"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edition */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier {editingUser?.email}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <Label>Nom</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rôle</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v ?? "AGENT" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="GESTIONNAIRE">Gestionnaire</SelectItem>
                    {isAdmin && <SelectItem value="ADMIN">Administrateur</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Niveau d&apos;accès</Label>
                <Select value={editForm.niveauAcces} onValueChange={(v) => setEditForm({ ...editForm, niveauAcces: v ?? "INTERNE" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="INTERNE">Interne</SelectItem>
                    <SelectItem value="CONFIDENTIEL">Confidentiel</SelectItem>
                    <SelectItem value="SECRET">Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isAdmin && (
              <label className="flex items-start gap-2 text-sm bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.peutGererUtilisateurs}
                  onChange={(e) => setEditForm({ ...editForm, peutGererUtilisateurs: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Peut gérer les comptes</span>
                  <br />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Délégation de l&apos;administration des utilisateurs (sauf admin).
                  </span>
                </span>
              </label>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Mot de passe */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Nouveau mot de passe pour <span className="font-medium">{editingUser?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <Label>Nouveau mot de passe (min 6 caractères)</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Communiquez ce mot de passe à l&apos;utilisateur ; il pourra le changer ensuite.
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setPwdOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Réinitialiser"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le compte ?</DialogTitle>
            <DialogDescription>
              Le compte <span className="font-medium">{editingUser?.email}</span> sera supprimé définitivement.
              Cette action est irréversible.
              {(editingUser?._count.courriers ?? 0) > 0 && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  ⚠️ Ce compte a {editingUser?._count.courriers} courrier(s) liés. La suppression sera refusée — préférez désactiver.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button type="button" disabled={loading} className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
