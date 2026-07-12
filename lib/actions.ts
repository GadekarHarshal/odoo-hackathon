"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { checkAndAwardBadges } from "./gamification"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

export async function createCarbonTransaction(formData: FormData) {
  const departmentId = formData.get("departmentId") as string
  const sourceType = formData.get("sourceType") as any
  const emissionFactorId = formData.get("emissionFactorId") as string
  const quantity = parseFloat(formData.get("quantity") as string)
  const transactionDate = new Date(formData.get("transactionDate") as string)

  // Get config to check if auto emission calculation is enabled
  const config = await prisma.orgESGConfig.findFirst()
  const autoCalc = config ? config.autoEmissionCalculationEnabled : true

  let calculatedCO2e = 0
  if (autoCalc) {
    const factor = await prisma.emissionFactor.findUnique({
      where: { id: emissionFactorId }
    })
    if (!factor) throw new Error("Emission factor not found")
    calculatedCO2e = quantity * factor.co2eFactorValue
  } else {
    calculatedCO2e = parseFloat(formData.get("calculatedCO2e") as string || "0")
  }

  await prisma.carbonTransaction.create({
    data: {
      departmentId,
      sourceType,
      emissionFactorId,
      quantity,
      calculatedCO2e,
      calculationMethod: autoCalc ? "Auto" : "Manual",
      transactionDate,
    }
  })

  // Create Activity Log
  await prisma.activityLog.create({
    data: {
      action: "CreateTransaction",
      entity: "CarbonTransaction",
      details: `Logged ${calculatedCO2e.toFixed(1)} kg CO2e for department`
    }
  })

  revalidatePath("/environmental/carbon-transactions")
  revalidatePath("/environmental")
  revalidatePath("/dashboard")
}

export async function createEnvironmentalGoal(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const targetMetric = formData.get("targetMetric") as string
  const targetValue = parseFloat(formData.get("targetValue") as string)
  const currentValue = parseFloat(formData.get("currentValue") as string || "0")
  const departmentId = formData.get("departmentId") as string || null
  const startDate = new Date(formData.get("startDate") as string)
  const deadline = new Date(formData.get("deadline") as string)

  await prisma.environmentalGoal.create({
    data: {
      title,
      description,
      targetMetric,
      targetValue,
      currentValue,
      departmentId,
      startDate,
      deadline,
      status: "Active",
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "CreateGoal",
      entity: "EnvironmentalGoal",
      details: `Created goal: "${title}"`,
    },
  })

  revalidatePath("/environmental/goals")
  revalidatePath("/environmental")
  revalidatePath("/dashboard")
}

export async function createCSRActivity(formData: FormData) {
  const title = formData.get("title") as string
  const categoryId = formData.get("categoryId") as string
  const description = formData.get("description") as string
  const departmentId = formData.get("departmentId") as string || null
  const startDate = new Date(formData.get("startDate") as string)
  const endDate = new Date(formData.get("endDate") as string)

  await prisma.cSRActivity.create({
    data: {
      title,
      categoryId,
      description,
      departmentId,
      startDate,
      endDate,
      status: "Active",
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "CreateCSRActivity",
      entity: "CSRActivity",
      details: `Created CSR Activity: "${title}"`,
    },
  })

  revalidatePath("/social/csr-activities")
  revalidatePath("/social")
  revalidatePath("/dashboard")
}

export async function submitCSRParticipation(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const csrActivityId = formData.get("csrActivityId") as string
  const proofFileUrl = formData.get("proofFileUrl") as string || null

  await prisma.employeeParticipation.create({
    data: {
      employeeId: session.user.id,
      csrActivityId,
      proofFileUrl,
      approvalStatus: "Pending",
      pointsEarned: 0
    }
  })

  revalidatePath("/social/participation")
}

export async function approveCSRParticipation(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const participationId = formData.get("id") as string
  
  const participation = await prisma.employeeParticipation.findUnique({
    where: { id: participationId },
    include: { csrActivity: true }
  })
  if (!participation) throw new Error("Participation not found")

  // Check config for evidence requirement
  const config = await prisma.orgESGConfig.findFirst()
  if (config?.evidenceRequirementEnabled && !participation.proofFileUrl) {
    throw new Error("Cannot approve: Evidence/proof file is required.")
  }

  const pointsAwarded = 50
  const xpAwarded = 100

  // Update participation
  await prisma.employeeParticipation.update({
    where: { id: participationId },
    data: {
      approvalStatus: "Approved",
      pointsEarned: pointsAwarded,
      completionDate: new Date(),
      approvedById: session.user.id
    }
  })

  // Award employee points and XP
  await prisma.employee.update({
    where: { id: participation.employeeId },
    data: {
      points: { increment: pointsAwarded },
      xp: { increment: xpAwarded }
    }
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      actorId: session.user.id,
      action: "ApproveParticipation",
      entity: "EmployeeParticipation",
      entityId: participationId,
      details: `Approved ${pointsAwarded} points for ${participation.employeeId}`
    }
  })

  // Create notification
  await prisma.notification.create({
    data: {
      recipientEmployeeId: participation.employeeId,
      type: "ApprovalDecision",
      message: `Your participation for "${participation.csrActivity.title}" has been approved! Earned ${pointsAwarded} points.`,
      channel: "InApp"
    }
  })

  // Check auto badge awards
  await checkAndAwardBadges(participation.employeeId)

  revalidatePath("/social/participation")
  revalidatePath("/social")
  revalidatePath("/dashboard")
}

export async function rejectCSRParticipation(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const participationId = formData.get("id") as string

  const participation = await prisma.employeeParticipation.findUnique({
    where: { id: participationId },
    include: { csrActivity: true }
  })
  if (!participation) throw new Error("Participation not found")

  await prisma.employeeParticipation.update({
    where: { id: participationId },
    data: {
      approvalStatus: "Rejected",
      pointsEarned: 0
    }
  })

  await prisma.notification.create({
    data: {
      recipientEmployeeId: participation.employeeId,
      type: "ApprovalDecision",
      message: `Your participation for "${participation.csrActivity.title}" has been rejected.`,
      channel: "InApp"
    }
  })

  revalidatePath("/social/participation")
}

export async function createESGPolicy(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const version = formData.get("version") as string
  const effectiveDate = new Date(formData.get("effectiveDate") as string)
  const status = formData.get("status") as any
  const fileUrl = formData.get("fileUrl") as string || null

  await prisma.eSGPolicy.create({
    data: {
      title,
      description,
      category,
      version,
      effectiveDate,
      status,
      fileUrl,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "CreatePolicy",
      entity: "ESGPolicy",
      details: `Created policy: "${title}" (v${version})`,
    },
  })

  revalidatePath("/governance/policies")
  revalidatePath("/governance/acknowledgements")
  revalidatePath("/dashboard")
}

export async function acknowledgePolicy(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const policyId = formData.get("policyId") as string

  // Check if already acknowledged
  const existing = await prisma.policyAcknowledgement.findFirst({
    where: { policyId, employeeId: session.user.id },
  })

  if (!existing) {
    await prisma.policyAcknowledgement.create({
      data: {
        policyId,
        employeeId: session.user.id,
        acknowledgedAt: new Date(),
        status: "Approved",
      },
    })

    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: "AcknowledgePolicy",
        entity: "PolicyAcknowledgement",
        details: `Acknowledged policy: "${policyId}"`,
      },
    })
  }

  revalidatePath("/governance/acknowledgements")
  revalidatePath("/governance")
  revalidatePath("/dashboard")
}

export async function createAudit(formData: FormData) {
  const title = formData.get("title") as string
  const departmentId = formData.get("departmentId") as string
  const auditorId = formData.get("auditorId") as string
  const scope = formData.get("scope") as string
  const scheduledDate = new Date(formData.get("scheduledDate") as string)

  await prisma.audit.create({
    data: {
      title,
      departmentId,
      auditorId,
      scope,
      scheduledDate,
      status: "Planned",
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "CreateAudit",
      entity: "Audit",
      details: `Scheduled Audit: "${title}"`,
    },
  })

  revalidatePath("/governance/audits")
  revalidatePath("/governance")
  revalidatePath("/dashboard")
}

export async function createComplianceIssue(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const severity = formData.get("severity") as any
  const ownerId = formData.get("ownerId") as string
  const dueDate = new Date(formData.get("dueDate") as string)
  const auditId = formData.get("auditId") as string || null

  const issue = await prisma.complianceIssue.create({
    data: {
      title,
      description,
      severity,
      ownerId,
      dueDate,
      auditId,
      status: "Open",
      raisedDate: new Date(),
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "CreateComplianceIssue",
      entity: "ComplianceIssue",
      entityId: issue.id,
      details: `Raised compliance issue: "${title}" (Severity: ${severity})`,
    },
  })

  await prisma.notification.create({
    data: {
      recipientEmployeeId: ownerId,
      type: "ComplianceIssueRaised",
      message: `You have been assigned a new compliance issue: "${title}". Due date: ${dueDate.toLocaleDateString()}.`,
      channel: "InApp",
    },
  })

  revalidatePath("/governance/compliance-issues")
  revalidatePath("/governance")
  revalidatePath("/dashboard")
}

export async function joinChallenge(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const challengeId = formData.get("challengeId") as string

  // Check if already joined
  const existing = await prisma.challengeParticipation.findFirst({
    where: { challengeId, employeeId: session.user.id }
  })
  if (existing) return

  await prisma.challengeParticipation.create({
    data: {
      challengeId,
      employeeId: session.user.id,
      progressPercent: 0,
      approvalStatus: "Pending",
      xpAwarded: 0
    }
  })

  revalidatePath("/gamification/challenges")
}

export async function submitChallengeEvidence(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const challengeId = formData.get("challengeId") as string
  const progressPercent = parseInt(formData.get("progressPercent") as string)
  const proofFileUrl = formData.get("proofFileUrl") as string || null

  const participation = await prisma.challengeParticipation.findFirst({
    where: { challengeId, employeeId: session.user.id }
  })
  if (!participation) throw new Error("Not participating in this challenge")

  await prisma.challengeParticipation.update({
    where: { id: participation.id },
    data: {
      progressPercent,
      proofFileUrl,
      approvalStatus: progressPercent === 100 ? "Pending" : participation.approvalStatus
    }
  })

  revalidatePath("/gamification/challenges")
}

export async function approveChallengeParticipation(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const id = formData.get("id") as string

  const cp = await prisma.challengeParticipation.findUnique({
    where: { id },
    include: { challenge: true }
  })
  if (!cp) throw new Error("Participation not found")

  // Update status to Approved
  await prisma.challengeParticipation.update({
    where: { id },
    data: {
      approvalStatus: "Approved",
      xpAwarded: cp.challenge.xp
    }
  })

  // Award XP and points to the employee
  await prisma.employee.update({
    where: { id: cp.employeeId },
    data: {
      xp: { increment: cp.challenge.xp },
      points: { increment: Math.floor(cp.challenge.xp / 2) }
    }
  })

  // Create notification
  await prisma.notification.create({
    data: {
      recipientEmployeeId: cp.employeeId,
      type: "ApprovalDecision",
      message: `Your proof for challenge "${cp.challenge.title}" was approved! Earned ${cp.challenge.xp} XP.`,
      channel: "InApp"
    }
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      actorId: session.user.id,
      action: "ApproveChallenge",
      entity: "ChallengeParticipation",
      entityId: id,
      details: `Approved challenge progress for ${cp.employeeId}`
    }
  })

  // Check auto badge awards
  await checkAndAwardBadges(cp.employeeId)

  revalidatePath("/gamification/challenges")
  revalidatePath("/gamification/badges")
  revalidatePath("/dashboard")
}
