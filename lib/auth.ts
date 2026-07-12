import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const employee = await prisma.employee.findUnique({
          where: { email: credentials.email },
        })
        if (!employee) return null
        const valid = await bcrypt.compare(credentials.password, employee.password)
        if (!valid) return null
        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          departmentId: employee.departmentId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.departmentId = (user as any).departmentId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.departmentId = token.departmentId as string | null
      }
      return session
    },
  },
}
