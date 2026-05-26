import { prisma } from "@/lib/prisma"

export async function logAction(params: {
  userId: string
  action: string
  details?: string
  courrierId?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        details: params.details,
        courrierId: params.courrierId,
      },
    })
  } catch (e) {
    console.error("Audit log error:", e)
  }
}

export async function createNotification(params: {
  userId: string
  type: string
  titre: string
  message: string
  lien?: string
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        titre: params.titre,
        message: params.message,
        lien: params.lien,
      },
    })
  } catch (e) {
    console.error("Notification error:", e)
  }
}

export async function notifyAdmins(params: {
  type: string
  titre: string
  message: string
  lien?: string
  exceptUserId?: string
}) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "GESTIONNAIRE"] },
        ...(params.exceptUserId ? { id: { not: params.exceptUserId } } : {}),
      },
      select: { id: true },
    })
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: params.type,
        titre: params.titre,
        message: params.message,
        lien: params.lien,
      })),
    })
  } catch (e) {
    console.error("Bulk notification error:", e)
  }
}
