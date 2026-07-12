import { revalidatePath } from "next/cache"
import {
  CategoryType,
  Department,
  NotificationChannel,
  NotificationType,
  OrgESGConfig,
  Status,
} from "@prisma/client"
import { prisma } from "@/lib/prisma"

export function formatEnum(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())
}

export async function getDepartments(): Promise<Array<Department & { parent: Department | null; children: Department[] }>> {
  return prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      parent: true,
      children: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
    },
  })
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  })
}

export async function getEmissionFactors() {
  return prisma.emissionFactor.findMany({
    where: { deletedAt: null },
    orderBy: [{ name: "asc" }, { effectiveDate: "desc" }],
  })
}

async function recalculateDepartmentScores() {
  const config = await prisma.orgESGConfig.findFirst()
  if (!config) return

  const periodEnd = new Date()
  const periodStart = new Date(periodEnd)
  periodStart.setDate(periodEnd.getDate() - 30)

  await prisma.departmentScore.deleteMany({
    where: {
      periodStart: periodStart,
      periodEnd: periodEnd,
    },
  })

  const departments = await prisma.department.findMany({ where: { deletedAt: null } })

  for (const department of departments) {
    const transactions = await prisma.carbonTransaction.findMany({
      where: {
        departmentId: department.id,
        transactionDate: { gte: periodStart, lte: periodEnd },
      },
    })

    const envScore = Math.max(0, 100 - transactions.reduce((sum, tx) => sum + tx.calculatedCO2e, 0) / 100)
    const socialCount = await prisma.employeeParticipation.count({
      where: {
        approvalStatus: "Approved",
        csrActivity: { departmentId: department.id },
      },
    })
    const socialScore = Math.min(100, socialCount * 10)
    const totalEmployees = await prisma.employee.count({ where: { departmentId: department.id } })
    const ackCount = await prisma.policyAcknowledgement.count({
      where: {
        status: "Approved",
        employee: { departmentId: department.id },
      },
    })
    const governanceScore = totalEmployees === 0 ? 0 : Math.min(100, (ackCount / totalEmployees) * 100)
    const totalScore =
      (envScore * config.environmentalWeight + socialScore * config.socialWeight + governanceScore * config.governanceWeight) / 100

    await prisma.departmentScore.create({
      data: {
        departmentId: department.id,
        periodStart,
        periodEnd,
        environmentalScore: envScore,
        socialScore,
        governanceScore,
        totalScore,
      },
    })
  }
}

export async function getOrgESGConfig() {
  const config = await prisma.orgESGConfig.findFirst()
  if (config) return config

  return prisma.orgESGConfig.create({
    data: {
      environmentalWeight: 40,
      socialWeight: 30,
      governanceWeight: 30,
      autoEmissionCalculationEnabled: true,
      evidenceRequirementEnabled: false,
      badgeAutoAwardEnabled: true,
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: false,
    },
  })
}

export async function getNotificationSettings() {
  const count = await prisma.notificationSetting.count()
  if (count === 0) {
    const defaults = Object.values(NotificationType).flatMap((type) =>
      Object.values(NotificationChannel).map((channel) => ({
        notificationType: type,
        channel,
        enabled: channel === NotificationChannel.InApp,
      }))
    )
    await prisma.notificationSetting.createMany({ data: defaults, skipDuplicates: true })
  }

  return prisma.notificationSetting.findMany({
    orderBy: [{ notificationType: "asc" }, { channel: "asc" }],
  })
}

export async function createDepartment(formData: FormData) {
  "use server"
  const name = String(formData.get("name") ?? "").trim()
  const code = String(formData.get("code") ?? "").trim().toUpperCase()
  const parentDepartmentId = String(formData.get("parentDepartmentId") ?? "").trim() || null
  const status = (String(formData.get("status") ?? Status.Active) as Status) || Status.Active

  if (!name || !code) throw new Error("Name and code are required")

  const existing = await prisma.department.findUnique({ where: { code } })
  if (existing) throw new Error("Department code already exists")

  if (parentDepartmentId) {
    const parent = await prisma.department.findUnique({ where: { id: parentDepartmentId } })
    if (!parent) throw new Error("Parent department not found")
  }

  await prisma.department.create({
    data: {
      name,
      code,
      status,
      parentDepartmentId,
    },
  })

  revalidatePath("/settings/departments")
}

export async function updateDepartment(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const code = String(formData.get("code") ?? "").trim().toUpperCase()
  const parentDepartmentId = String(formData.get("parentDepartmentId") ?? "").trim() || null
  const status = (String(formData.get("status") ?? Status.Active) as Status) || Status.Active

  if (!id || !name || !code) throw new Error("Name and code are required")
  if (parentDepartmentId === id) throw new Error("A department cannot be its own parent")

  const department = await prisma.department.findUnique({ where: { id } })
  if (!department) throw new Error("Department not found")

  if (parentDepartmentId) {
    const parent = await prisma.department.findUnique({ where: { id: parentDepartmentId } })
    if (!parent) throw new Error("Parent department not found")
  }

  const existing = await prisma.department.findFirst({ where: { code, id: { not: id } } })
  if (existing) throw new Error("Another department already uses that code")

  await prisma.department.update({
    where: { id },
    data: {
      name,
      code,
      parentDepartmentId,
      status,
    },
  })

  revalidatePath("/settings/departments")
}

export async function toggleDepartmentStatus(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  if (!id) throw new Error("Department ID is required")
  const department = await prisma.department.findUnique({ where: { id } })
  if (!department) throw new Error("Department not found")

  if (department.status === Status.Active) {
    const childCount = await prisma.department.count({ where: { parentDepartmentId: id, deletedAt: null } })
    const employeeCount = await prisma.employee.count({ where: { departmentId: id } })
    if (childCount > 0) throw new Error("Cannot deactivate a department that has child departments")
    if (employeeCount > 0) throw new Error("Cannot deactivate a department with assigned employees")
  }

  await prisma.department.update({
    where: { id },
    data: {
      status: department.status === Status.Active ? Status.Inactive : Status.Active,
    },
  })

  revalidatePath("/settings/departments")
}

export async function softDeleteDepartment(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  if (!id) throw new Error("Department ID is required")

  const department = await prisma.department.findUnique({ where: { id } })
  if (!department) throw new Error("Department not found")

  const childCount = await prisma.department.count({ where: { parentDepartmentId: id, deletedAt: null } })
  const employeeCount = await prisma.employee.count({ where: { departmentId: id } })
  if (childCount > 0) throw new Error("Cannot delete a department that has child departments")
  if (employeeCount > 0) throw new Error("Cannot delete a department with assigned employees")

  await prisma.department.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: Status.Inactive,
    },
  })

  revalidatePath("/settings/departments")
}

export async function createCategory(formData: FormData) {
  "use server"
  const name = String(formData.get("name") ?? "").trim()
  const type = (String(formData.get("type") ?? CategoryType.ESG_GENERAL) as CategoryType) || CategoryType.ESG_GENERAL
  const status = (String(formData.get("status") ?? Status.Active) as Status) || Status.Active

  if (!name) throw new Error("Category name is required")

  await prisma.category.create({
    data: {
      name,
      type,
      status,
    },
  })

  revalidatePath("/settings/categories")
}

export async function updateCategory(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const type = (String(formData.get("type") ?? CategoryType.ESG_GENERAL) as CategoryType) || CategoryType.ESG_GENERAL
  const status = (String(formData.get("status") ?? Status.Active) as Status) || Status.Active

  if (!id || !name) throw new Error("Category name is required")

  await prisma.category.update({
    where: { id },
    data: {
      name,
      type,
      status,
    },
  })

  revalidatePath("/settings/categories")
}

export async function toggleCategoryStatus(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) return

  await prisma.category.update({
    where: { id },
    data: {
      status: category.status === Status.Active ? Status.Inactive : Status.Active,
    },
  })

  revalidatePath("/settings/categories")
}

export async function softDeleteCategory(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  if (!id) return

  await prisma.category.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: Status.Inactive,
    },
  })

  revalidatePath("/settings/categories")
}

export async function createEmissionFactor(formData: FormData) {
  "use server"
  const name = String(formData.get("name") ?? "").trim()
  const activityType = String(formData.get("activityType") ?? "").trim()
  const unit = String(formData.get("unit") ?? "").trim()
  const co2eFactorValue = Number(formData.get("co2eFactorValue") ?? 0)
  const source = String(formData.get("source") ?? "").trim()
  const effectiveDate = new Date(String(formData.get("effectiveDate") ?? new Date().toISOString().slice(0, 10)))
  const status = (String(formData.get("status") ?? Status.Active) as Status) || Status.Active

  if (!name || !activityType || !unit || Number.isNaN(co2eFactorValue)) throw new Error("All emission factor fields are required")

  await prisma.emissionFactor.create({
    data: {
      name,
      activityType,
      unit,
      co2eFactorValue,
      source,
      effectiveDate,
      status,
    },
  })

  revalidatePath("/settings/emission-factors")
}

export async function updateEmissionFactor(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const activityType = String(formData.get("activityType") ?? "").trim()
  const unit = String(formData.get("unit") ?? "").trim()
  const co2eFactorValue = Number(formData.get("co2eFactorValue") ?? 0)
  const source = String(formData.get("source") ?? "").trim()
  const effectiveDate = new Date(String(formData.get("effectiveDate") ?? new Date().toISOString().slice(0, 10)))
  const status = (String(formData.get("status") ?? Status.Active) as Status) || Status.Active

  if (!id || !name || !activityType || !unit || Number.isNaN(co2eFactorValue)) throw new Error("All emission factor fields are required")

  const factor = await prisma.emissionFactor.findUnique({ where: { id } })
  if (!factor) throw new Error("Emission factor not found")

  const usedCount = await prisma.carbonTransaction.count({ where: { emissionFactorId: id } })
  if (usedCount > 0) {
    await prisma.emissionFactor.update({
      where: { id },
      data: { status: Status.Inactive, deletedAt: new Date() },
    })
    await prisma.emissionFactor.create({
      data: {
        name,
        activityType,
        unit,
        co2eFactorValue,
        source,
        effectiveDate,
        status,
      },
    })
  } else {
    await prisma.emissionFactor.update({
      where: { id },
      data: {
        name,
        activityType,
        unit,
        co2eFactorValue,
        source,
        effectiveDate,
        status,
      },
    })
  }

  revalidatePath("/settings/emission-factors")
}

export async function toggleEmissionFactorStatus(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const factor = await prisma.emissionFactor.findUnique({ where: { id } })
  if (!factor) return

  await prisma.emissionFactor.update({
    where: { id },
    data: {
      status: factor.status === Status.Active ? Status.Inactive : Status.Active,
    },
  })

  revalidatePath("/settings/emission-factors")
}

export async function softDeleteEmissionFactor(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  if (!id) return

  await prisma.emissionFactor.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: Status.Inactive,
    },
  })

  revalidatePath("/settings/emission-factors")
}

export async function upsertOrgESGConfig(formData: FormData) {
  "use server"
  const environmentalWeight = Number(formData.get("environmentalWeight") ?? 40)
  const socialWeight = Number(formData.get("socialWeight") ?? 30)
  const governanceWeight = Number(formData.get("governanceWeight") ?? 30)
  const autoEmissionCalculationEnabled = formData.get("autoEmissionCalculationEnabled") === "on"
  const evidenceRequirementEnabled = formData.get("evidenceRequirementEnabled") === "on"
  const badgeAutoAwardEnabled = formData.get("badgeAutoAwardEnabled") === "on"
  const inAppNotificationsEnabled = formData.get("inAppNotificationsEnabled") === "on"
  const emailNotificationsEnabled = formData.get("emailNotificationsEnabled") === "on"

  const config = await prisma.orgESGConfig.findFirst()
  if (config) {
    await prisma.orgESGConfig.update({
      where: { id: config.id },
      data: {
        environmentalWeight,
        socialWeight,
        governanceWeight,
        autoEmissionCalculationEnabled,
        evidenceRequirementEnabled,
        badgeAutoAwardEnabled,
        inAppNotificationsEnabled,
        emailNotificationsEnabled,
      },
    })
  } else {
    await prisma.orgESGConfig.create({
      data: {
        environmentalWeight,
        socialWeight,
        governanceWeight,
        autoEmissionCalculationEnabled,
        evidenceRequirementEnabled,
        badgeAutoAwardEnabled,
        inAppNotificationsEnabled,
        emailNotificationsEnabled,
      },
    })
  }

  await recalculateDepartmentScores()
  revalidatePath("/settings/esg-config")
}

export async function toggleNotificationSetting(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  const enabled = formData.get("enabled") === "true"
  if (!id) return

  await prisma.notificationSetting.update({
    where: { id },
    data: { enabled },
  })

  revalidatePath("/settings/notifications")
}
