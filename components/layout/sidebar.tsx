"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Leaf, Users, Shield, Trophy, Settings, BarChart3,
  ChevronDown, Globe
} from "lucide-react"
import { useState } from "react"

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Environmental", icon: Leaf, children: [
      { label: "Dashboard", href: "/environmental" },
      { label: "Emission Factors", href: "/environmental/emission-factors" },
      { label: "Carbon Transactions", href: "/environmental/carbon-transactions" },
      { label: "Goals", href: "/environmental/goals" },
    ],
  },
  {
    label: "Social", icon: Users, children: [
      { label: "CSR Activities", href: "/social/csr-activities" },
      { label: "Participation", href: "/social/participation" },
      { label: "Diversity Metrics", href: "/social/diversity" },
    ],
  },
  {
    label: "Governance", icon: Shield, children: [
      { label: "Policies", href: "/governance/policies" },
      { label: "Acknowledgements", href: "/governance/acknowledgements" },
      { label: "Audits", href: "/governance/audits" },
      { label: "Compliance Issues", href: "/governance/compliance-issues" },
    ],
  },
  {
    label: "Gamification", icon: Trophy, children: [
      { label: "Challenges", href: "/gamification/challenges" },
      { label: "Badges", href: "/gamification/badges" },
      { label: "Rewards", href: "/gamification/rewards" },
      { label: "Leaderboard", href: "/gamification/leaderboard" },
    ],
  },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  {
    label: "Settings", icon: Settings, children: [
      { label: "Departments", href: "/settings/departments" },
      { label: "Categories", href: "/settings/categories" },
      { label: "ESG Config", href: "/settings/esg-config" },
      { label: "Notifications", href: "/settings/notifications" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState<string[]>([])

  const toggle = (label: string) =>
    setOpen((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label])

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Globe className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg">EcoSphere</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {nav.map((item) => {
          if (!item.children) {
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          }
          const isOpen = open.includes(item.label)
          const isActive = item.children.some((c) => pathname.startsWith(c.href))
          return (
            <div key={item.label}>
              <button
                onClick={() => toggle(item.label)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  isActive && "text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent",
                        pathname === child.href && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
