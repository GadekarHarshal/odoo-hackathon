import { prisma } from "@/lib/prisma"

export async function checkAndAwardBadges(employeeId: string) {
  // Fetch employee
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      badges: true
    }
  })
  if (!employee) return

  // Check if auto award is enabled
  const config = await prisma.orgESGConfig.findFirst()
  if (config && !config.badgeAutoAwardEnabled) {
    return
  }

  // Count completed challenges (approved and progress is 100%)
  const completedChallengesCount = await prisma.challengeParticipation.count({
    where: {
      employeeId,
      approvalStatus: "Approved",
      progressPercent: 100
    }
  })

  // Get active badges
  const badges = await prisma.badge.findMany({
    where: { status: "Active" }
  })

  const existingBadgeIds = new Set(employee.badges.map((eb) => eb.badgeId))

  for (const badge of badges) {
    if (existingBadgeIds.has(badge.id)) continue

    let unlocked = false
    try {
      const rule = typeof badge.unlockRule === "string"
        ? JSON.parse(badge.unlockRule)
        : (badge.unlockRule as any)

      if (rule.type === "XP") {
        if (employee.xp >= rule.threshold) {
          unlocked = true
        }
      } else if (rule.type === "CHALLENGES_COMPLETED") {
        if (completedChallengesCount >= rule.threshold) {
          unlocked = true
        }
      }
    } catch (err) {
      console.error(`Failed to parse unlockRule for badge ${badge.id}:`, err)
    }

    if (unlocked) {
      await prisma.employeeBadge.create({
        data: {
          employeeId,
          badgeId: badge.id
        }
      })

      await prisma.notification.create({
        data: {
          recipientEmployeeId: employee.id,
          type: "BadgeUnlocked",
          message: `Congratulations! You unlocked the badge "${badge.name}".`,
          channel: "InApp"
        }
      })
    }
  }
}
