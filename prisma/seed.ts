import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10)

  // 1) Org ESG Config
  const orgConfig = await prisma.orgESGConfig.upsert({
    where: { id: "org-config" },
    update: {
      environmentalWeight: 40,
      socialWeight: 30,
      governanceWeight: 30,
      autoEmissionCalculationEnabled: true,
      evidenceRequirementEnabled: true,
      badgeAutoAwardEnabled: true,
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: false,
    },
    create: {
      id: "org-config",
      environmentalWeight: 40,
      socialWeight: 30,
      governanceWeight: 30,
      autoEmissionCalculationEnabled: true,
      evidenceRequirementEnabled: true,
      badgeAutoAwardEnabled: true,
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: false,
    },
  })

  // 2) Departments (with parent/child)
  const ops = await prisma.department.upsert({
    where: { code: "OPS" },
    update: { name: "Operations", status: "Active" },
    create: { name: "Operations", code: "OPS", status: "Active" },
  })

  const manuf = await prisma.department.upsert({
    where: { code: "MFG" },
    update: { name: "Manufacturing", status: "Active", parentDepartmentId: ops.id },
    create: { name: "Manufacturing", code: "MFG", status: "Active", parentDepartmentId: ops.id },
  })

  const logistics = await prisma.department.upsert({
    where: { code: "LOG" },
    update: { name: "Logistics", status: "Active", parentDepartmentId: ops.id },
    create: { name: "Logistics", code: "LOG", status: "Active", parentDepartmentId: ops.id },
  })

  const eng = await prisma.department.upsert({
    where: { code: "ENG" },
    update: { name: "Engineering", status: "Active" },
    create: { name: "Engineering", code: "ENG", status: "Active" },
  })

  const hr = await prisma.department.upsert({
    where: { code: "HR" },
    update: { name: "HR", status: "Active" },
    create: { name: "HR", code: "HR", status: "Active" },
  })

  const finance = await prisma.department.upsert({
    where: { code: "FIN" },
    update: { name: "Finance", status: "Active" },
    create: { name: "Finance", code: "FIN", status: "Active" },
  })

  const departments = [ops, manuf, logistics, eng, hr, finance]

  // 3) Categories
  const categoriesData = [
    { name: "Community Volunteering", type: "CSR_ACTIVITY" },
    { name: "Beach Cleanup", type: "CSR_ACTIVITY" },
    { name: "Tree Planting", type: "CSR_ACTIVITY" },
    { name: "Donation Drive", type: "CSR_ACTIVITY" },
    { name: "Step Challenge", type: "CHALLENGE" },
    { name: "Waste Reduction Challenge", type: "CHALLENGE" },
    { name: "ESG Awareness", type: "ESG_GENERAL" },
    { name: "Policy Training", type: "ESG_GENERAL" },
  ]

  const categories = []
  for (const c of categoriesData) {
    let cat = await prisma.category.findFirst({ where: { name: c.name } })
    if (!cat) {
      cat = await prisma.category.create({ data: { name: c.name, type: c.type as any } })
    }
    categories.push(cat)
  }

  // 4) Emission Factors
  const efData = [
    { name: "Electricity (kWh)", activityType: "Energy", unit: "kWh", co2e: 0.5, source: "Manufacturing" },
    { name: "Diesel (L)", activityType: "Fuel", unit: "L", co2e: 2.68, source: "Fleet" },
    { name: "Paper (kg)", activityType: "Materials", unit: "kg", co2e: 1.2, source: "Expense" },
    { name: "Purchased Goods (kg)", activityType: "Purchase", unit: "kg", co2e: 0.8, source: "Purchase" },
    { name: "Air Travel (pax-km)", activityType: "Travel", unit: "pax-km", co2e: 0.15, source: "Expense" },
    { name: "Natural Gas (m3)", activityType: "Energy", unit: "m3", co2e: 1.9, source: "Manufacturing" },
  ]

  const emissionFactors = []
  for (const e of efData) {
    const ef = await prisma.emissionFactor.create({
      data: {
        name: e.name,
        activityType: e.activityType,
        unit: e.unit,
        co2eFactorValue: e.co2e,
        source: e.source,
        effectiveDate: new Date(),
      },
    })
    emissionFactors.push(ef)
  }

  // 5) Employees (20-25)
  const roles = ["Admin", "Manager", "Employee"]
  const emails = []
  const employees = []
  // create a few specific accounts
  const admin = await prisma.employee.upsert({
    where: { email: "admin@ecosphere.dev" },
    update: { name: "System Admin", role: "Admin", password: passwordHash, departmentId: eng.id, xp: 1200, points: 500 },
    create: { name: "System Admin", email: "admin@ecosphere.dev", role: "Admin", password: passwordHash, departmentId: eng.id, xp: 1200, points: 500 },
  })
  employees.push(admin)
  emails.push(admin.email)

  // one manager per department
  for (const d of departments) {
    const m = await prisma.employee.create({
      data: {
        name: `${d.name} Manager`,
        email: `${d.code.toLowerCase()}.manager@ecosphere.dev`,
        role: "Manager",
        departmentId: d.id,
        password: passwordHash,
        xp: Math.floor(Math.random() * 800) + 200,
        points: Math.floor(Math.random() * 300),
      },
    })
    employees.push(m)
    emails.push(m.email)
  }

  // remaining employees
  const totalEmployees = 22
  const names = ["Alex", "Sam", "Jordan", "Taylor", "Riley", "Morgan", "Casey", "Jamie", "Drew", "Charlie", "Dakota", "Avery", "Quinn", "Parker", "Rowan", "Sage", "Reese", "Logan"]
  for (let i = 0; employees.length < totalEmployees; i++) {
    const name = names[i % names.length]
    const dept = departments[i % departments.length]
    const email = `${name.toLowerCase()}.${i}@ecosphere.dev`
    const emp = await prisma.employee.create({
      data: {
        name: `${name} ${i}`,
        email,
        role: "Employee",
        departmentId: dept.id,
        password: passwordHash,
        xp: Math.floor(Math.random() * 500),
        points: Math.floor(Math.random() * 200),
        joinDate: daysAgo(30 + i),
      },
    })
    employees.push(emp)
    emails.push(email)
  }

  // 6) CSR Activities
  const csrActivitiesData = [
    { title: "Community Volunteering Day", categoryName: "Community Volunteering", dept: eng },
    { title: "Beach Cleanup - South Bay", categoryName: "Beach Cleanup", dept: logistics },
    { title: "Tree Planting Drive", categoryName: "Tree Planting", dept: manuf },
    { title: "Donation Drive for Shelter", categoryName: "Donation Drive", dept: hr },
    { title: "Local School Support", categoryName: "Community Volunteering", dept: finance },
    { title: "Neighborhood Garden", categoryName: "Community Volunteering", dept: eng },
  ]

  const csrActivities = []
  for (const c of csrActivitiesData) {
    const category = categories.find((x) => x.name === c.categoryName)
    const act = await prisma.cSRActivity.create({
      data: {
        title: c.title,
        categoryId: category!.id,
        departmentId: c.dept.id,
        startDate: daysAgo(60),
        endDate: daysAgo(55),
        status: "Active",
      },
    })
    csrActivities.push(act)
  }

  // 7) Employee Participations (mix of statuses)
  const participations = []
  for (let i = 0; i < 28; i++) {
    const emp = employees[(i * 3) % employees.length]
    const activity = csrActivities[i % csrActivities.length]
    const approvalChoice = i % 5 === 0 ? "Rejected" : i % 4 === 0 ? "Pending" : "Approved"
    const proof = approvalChoice === "Approved" ? `https://picsum.photos/seed/proof${i}/400/300` : null
    const pp = await prisma.employeeParticipation.create({
      data: {
        employeeId: emp.id,
        csrActivityId: activity.id,
        proofFileUrl: proof,
        approvalStatus: approvalChoice as any,
        pointsEarned: approvalChoice === "Approved" ? Math.floor(Math.random() * 50) + 10 : 0,
        completionDate: approvalChoice === "Approved" ? daysAgo(20 - (i % 5)) : null,
        approvedById: approvalChoice === "Approved" ? employees[1].id : null,
      },
    })
    participations.push(pp)
    // award points on approval
    if (pp.approvalStatus === "Approved") {
      await prisma.employee.update({ where: { id: emp.id }, data: { points: { increment: pp.pointsEarned }, xp: { increment: Math.floor(pp.pointsEarned / 2) } } })
      await prisma.notification.create({ data: { recipientEmployeeId: emp.id, type: "ApprovalDecision", message: `Your participation for ${activity.title} was approved.`, channel: "InApp" } })
      await prisma.activityLog.create({ data: { actorId: employees[1].id, action: "ApproveParticipation", entity: "EmployeeParticipation", entityId: pp.id, details: `Approved ${pp.pointsEarned} points` } })
    }
  }

  // 8) Challenges and participations
  const challengesData = [
    { title: "10k Steps Challenge", categoryName: "Step Challenge", xp: 100, status: "Active" },
    { title: "Waste Reduction", categoryName: "Waste Reduction Challenge", xp: 80, status: "Active" },
    { title: "Paperless Month", categoryName: "ESG Awareness", xp: 60, status: "UnderReview" },
    { title: "Energy Saving Sprint", categoryName: "ESG Awareness", xp: 120, status: "Completed" },
    { title: "Team Recycling", categoryName: "Step Challenge", xp: 40, status: "Draft" },
    { title: "Green Commute Week", categoryName: "Step Challenge", xp: 150, status: "Archived" },
    { title: "Water Conservation Hack", categoryName: "Waste Reduction Challenge", xp: 90, status: "Active" },
  ]

  const challenges = []
  for (const c of challengesData) {
    const cat = categories.find((x) => x.name === c.categoryName) || categories[0]
    const ch = await prisma.challenge.create({ data: { title: c.title, categoryId: cat.id, xp: c.xp, status: c.status as any, deadline: daysAgo(10) } })
    challenges.push(ch)
  }

  const challengeParticipations = []
  for (let i = 0; i < 22; i++) {
    const emp = employees[(i * 5) % employees.length]
    const ch = challenges[i % challenges.length]
    const approval = i % 3 === 0 ? "Pending" : "Approved"
    const cp = await prisma.challengeParticipation.create({ data: { challengeId: ch.id, employeeId: emp.id, progressPercent: Math.floor(Math.random() * 100), proofFileUrl: approval === "Approved" ? `https://picsum.photos/seed/chproof${i}/400/300` : null, approvalStatus: approval as any, xpAwarded: approval === "Approved" ? ch.xp : 0 } })
    challengeParticipations.push(cp)
    if (cp.approvalStatus === "Approved") {
      await prisma.employee.update({ where: { id: emp.id }, data: { xp: { increment: cp.xpAwarded }, points: { increment: Math.floor(cp.xpAwarded / 2) } } })
      await prisma.activityLog.create({ data: { actorId: emp.id, action: "CompleteChallenge", entity: "ChallengeParticipation", entityId: cp.id, details: `Awarded ${cp.xpAwarded} XP` } })
      await prisma.notification.create({ data: { recipientEmployeeId: emp.id, type: "ApprovalDecision", message: `Your challenge ${ch.title} was approved.`, channel: "InApp" } })
    }
  }

  // 9) Badges & Rewards
  const badges = []
  const badgeDefs = [
    { name: "Eco Starter", unlockRule: { type: "XP", threshold: 100 } },
    { name: "Sustainer", unlockRule: { type: "XP", threshold: 500 } },
    { name: "Champion", unlockRule: { type: "XP", threshold: 1000 } },
    { name: "Volunteer", unlockRule: { type: "CHALLENGES_COMPLETED", threshold: 5 } },
    { name: "Green Leader", unlockRule: { type: "XP", threshold: 2000 } },
  ]
  for (const b of badgeDefs) {
    const created = await prisma.badge.create({ data: { name: b.name, unlockRule: b.unlockRule as any, status: "Active" } })
    badges.push(created)
  }

  const rewards = []
  const rewardDefs = [
    { name: "Coffee Mug", pointsRequired: 50, stock: 10 },
    { name: "Eco Tote", pointsRequired: 100, stock: 5 },
    { name: "Gift Card", pointsRequired: 300, stock: 2 },
    { name: "Extra Day Off", pointsRequired: 1000, stock: 0 },
    { name: "Company Swag Pack", pointsRequired: 200, stock: 3 },
  ]
  for (const r of rewardDefs) {
    const rw = await prisma.reward.create({ data: { name: r.name, pointsRequired: r.pointsRequired, stock: r.stock, status: "Active" } })
    rewards.push(rw)
  }

  // create some historical redemptions
  for (let i = 0; i < 6; i++) {
    const emp = employees[(i * 4) % employees.length]
    const reward = rewards[i % rewards.length]
    if (emp.points >= reward.pointsRequired && reward.stock > 0) {
      await prisma.rewardRedemption.create({ data: { employeeId: emp.id, rewardId: reward.id, pointsSpent: reward.pointsRequired, status: "Fulfilled" } })
      await prisma.employee.update({ where: { id: emp.id }, data: { points: { decrement: reward.pointsRequired } } })
      await prisma.reward.update({ where: { id: reward.id }, data: { stock: { decrement: 1 } } })
    }
  }

  // 10) Carbon Transactions (40-60 over last 6 months, producing a trend)
  const carbonTxs = []
  const months = 6
  for (let m = months; m >= 0; m--) {
    const monthDate = daysAgo(m * 30)
    // gradually increase baseline, but have one dept improve in last month
    for (let i = 0; i < 6; i++) {
      const dept = departments[i % departments.length]
      const ef = emissionFactors[i % emissionFactors.length]
      const quantity = Math.random() * (50 + m * 5) + (i === 2 && m === 1 ? 5 : 20)
      const calculated = quantity * ef.co2eFactorValue
      const tx = await prisma.carbonTransaction.create({ data: { departmentId: dept.id, sourceType: (i % 4 === 0 ? "Purchase" : i % 4 === 1 ? "Manufacturing" : i % 4 === 2 ? "Expense" : "Fleet") as any, emissionFactorId: ef.id, quantity, calculatedCO2e: calculated, calculationMethod: "Manual", transactionDate: monthDate } })
      carbonTxs.push(tx)
    }
  }

  // 11) Environmental Goals
  const goals = []
  const g1 = await prisma.environmentalGoal.create({ data: { title: "Reduce CO2e by 10%", description: "Reduce emissions by focusing on fleet efficiency.", targetMetric: "CO2e", targetValue: 10000, currentValue: 8000, departmentId: ops.id, startDate: daysAgo(180), deadline: daysAgo(7), status: "Active" } })
  const g2 = await prisma.environmentalGoal.create({ data: { title: "Cut Paper Use", description: "Move to digital invoices.", targetMetric: "Paper (kg)", targetValue: 500, currentValue: 200, departmentId: finance.id, startDate: daysAgo(120), deadline: daysAgo(60), status: "Active" } })
  const g3 = await prisma.environmentalGoal.create({ data: { title: "Improve Energy Efficiency", targetMetric: "kWh", targetValue: 20000, currentValue: 19000, departmentId: manuf.id, startDate: daysAgo(200), deadline: daysAgo(15), status: "Active" } })
  
  const targetDateOnTrack = new Date()
  targetDateOnTrack.setDate(targetDateOnTrack.getDate() + 30)
  const g4 = await prisma.environmentalGoal.create({ data: { title: "Reduce Green Commute Carbon", description: "Promote bicycling and hybrid work options.", targetMetric: "CO2e (tons)", targetValue: 1000, currentValue: 950, departmentId: logistics.id, startDate: daysAgo(30), deadline: targetDateOnTrack, status: "Active" } })

  const targetDateAtRisk = new Date()
  targetDateAtRisk.setDate(targetDateAtRisk.getDate() + 2)
  const g5 = await prisma.environmentalGoal.create({ data: { title: "Water Conservation Phase 1", description: "Fix plumbing leaks and implement low flow taps.", targetMetric: "Liters", targetValue: 2000, currentValue: 100, departmentId: ops.id, startDate: daysAgo(10), deadline: targetDateAtRisk, status: "Active" } })
  
  goals.push(g1, g2, g3, g4, g5)

  // 12) Policies + acknowledgements (make many acknowledged, a few outstanding)
  const policies = []
  for (let i = 0; i < 5; i++) {
    const pol = await prisma.eSGPolicy.create({ data: { title: `Policy ${i + 1}`, description: `Policy ${i + 1} description`, category: "Governance", version: `1.${i}`, effectiveDate: daysAgo(200 - i * 10), status: i === 4 ? "Archived" : i === 3 ? "Draft" : "Active", fileUrl: null } })
    policies.push(pol)
  }

  // Acknowledge policies for most employees (approx 90%)
  for (const pol of policies) {
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i]
      const shouldAck = Math.random() > 0.1 || emp.role === "Admin"
      if (shouldAck) {
        await prisma.policyAcknowledgement.create({ data: { policyId: pol.id, employeeId: emp.id, acknowledgedAt: daysAgo(5), status: "Approved" } }).catch(() => {})
      }
    }
  }

  // 13) Audits & Compliance Issues
  const audits = []
  for (let i = 0; i < 4; i++) {
    const auditor = employees[(i + 2) % employees.length]
    const audit = await prisma.audit.create({ data: { title: `Audit ${i + 1}`, departmentId: departments[i % departments.length].id, auditorId: auditor.id, scope: "Operational", scheduledDate: daysAgo(40 - i * 10), status: i === 0 ? "Completed" : i === 1 ? "InProgress" : "Planned" } })
    audits.push(audit)
  }

  const issues = []
  for (let i = 0; i < 10; i++) {
    const owner = employees[(i + 3) % employees.length]
    const due = daysAgo(i % 3 === 0 ? 10 + i : -5 - i) // some past due
    const status = i % 4 === 0 ? "Resolved" : i % 5 === 0 ? "Closed" : "Open"
    const sev = i % 4 === 0 ? "Critical" : i % 3 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low"
    const issue = await prisma.complianceIssue.create({ data: { title: `Issue ${i + 1}`, description: "Something to remediate", ownerId: owner.id, dueDate: due, status: status as any, severity: sev as any, raisedDate: daysAgo(30 - i) } })
    issues.push(issue)
    if (issue.status === "Open" && issue.dueDate < new Date()) {
      await prisma.notification.create({ data: { recipientEmployeeId: owner.id, type: "ComplianceIssueRaised", message: `Compliance issue ${issue.title} is overdue.`, channel: "InApp" } })
    }
  }

  // 14) Activity logs: capture key seeded actions
  await prisma.activityLog.createMany({ data: [
    { actorId: admin.id, action: "Seed", entity: "OrgESGConfig", entityId: orgConfig.id, details: "Initial configuration" },
    { actorId: admin.id, action: "Seed", entity: "Departments", details: "Seeded departments" },
    { actorId: admin.id, action: "Seed", entity: "Employees", details: `Seeded ${employees.length} employees` },
  ] }).catch(() => {})

  // 15) DepartmentScore calculation: simple heuristic
  const periodEnd = new Date()
  const periodStart = daysAgo(30)
  for (const d of departments) {
    const txs = await prisma.carbonTransaction.findMany({ where: { departmentId: d.id, transactionDate: { gte: periodStart, lte: periodEnd } } })
    const envScore = Math.max(0, 100 - (txs.reduce((s, t) => s + t.calculatedCO2e, 0) / 100))
    const socialCount = await prisma.employeeParticipation.count({ where: { csrActivity: { departmentId: d.id }, approvalStatus: "Approved" } })
    const socialScore = Math.min(100, socialCount * 10)
    const totalEmployees = await prisma.employee.count({ where: { departmentId: d.id } })
    const ackCount = await prisma.policyAcknowledgement.count({ where: { policy: { }, employee: { departmentId: d.id } } }).catch(() => 0)
    const governanceScore = totalEmployees === 0 ? 0 : Math.min(100, (ackCount / Math.max(1, totalEmployees)) * 100)
    const total = (envScore * orgConfig.environmentalWeight + socialScore * orgConfig.socialWeight + governanceScore * orgConfig.governanceWeight) / 100
    await prisma.departmentScore.create({ data: { departmentId: d.id, periodStart, periodEnd, environmentalScore: envScore, socialScore: socialScore, governanceScore: governanceScore, totalScore: total } })
    // prior period
    await prisma.departmentScore.create({ data: { departmentId: d.id, periodStart: daysAgo(60), periodEnd: daysAgo(31), environmentalScore: Math.max(0, envScore - 5), socialScore: Math.max(0, socialScore - 10), governanceScore: Math.max(0, governanceScore - 2), totalScore: Math.max(0, total - 3) } })
  }

  // Evaluate and award badges for all employees based on the seeded stats
  const allEmps = await prisma.employee.findMany()
  const activeBadges = await prisma.badge.findMany({ where: { status: "Active" } })
  for (const emp of allEmps) {
    const completedChallengesCount = await prisma.challengeParticipation.count({
      where: { employeeId: emp.id, approvalStatus: "Approved", progressPercent: 100 }
    })
    for (const badge of activeBadges) {
      const rule = typeof badge.unlockRule === "string" ? JSON.parse(badge.unlockRule) : badge.unlockRule as any
      let unlocked = false
      if (rule.type === "XP") {
        if (emp.xp >= rule.threshold) unlocked = true
      } else if (rule.type === "CHALLENGES_COMPLETED") {
        if (completedChallengesCount >= rule.threshold) unlocked = true
      }
      if (unlocked) {
        await prisma.employeeBadge.upsert({
          where: { employeeId_badgeId: { employeeId: emp.id, badgeId: badge.id } },
          update: {},
          create: { employeeId: emp.id, badgeId: badge.id }
        }).catch(() => {})
      }
    }
  }

  // 16) Summary counts
  const counts = {
    departments: await prisma.department.count(),
    employees: await prisma.employee.count(),
    categories: await prisma.category.count(),
    emissionFactors: await prisma.emissionFactor.count(),
    carbonTransactions: await prisma.carbonTransaction.count(),
    csrActivities: await prisma.cSRActivity.count(),
    participations: await prisma.employeeParticipation.count(),
    challenges: await prisma.challenge.count(),
    challengeParticipations: await prisma.challengeParticipation.count(),
    badges: await prisma.badge.count(),
    rewards: await prisma.reward.count(),
    redemptions: await prisma.rewardRedemption.count(),
    notifications: await prisma.notification.count(),
    activityLogs: await prisma.activityLog.count(),
    deptScores: await prisma.departmentScore.count(),
  }

  console.log("Seed summary:")
  console.table(counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
