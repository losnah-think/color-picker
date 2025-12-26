import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getPrismaClient } from "@/lib/prisma"
import bcrypt from "bcryptjs"

let prisma: any
try {
  prisma = getPrismaClient()
} catch (error) {
  console.error("Failed to initialize Prisma:", error)
  throw new Error("Database connection failed")
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.")
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
            },
          })

          if (!user) {
            throw new Error("등록되지 않은 이메일입니다.")
          }

          if (!user.password) {
            throw new Error("비밀번호가 설정되지 않았습니다.")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log("Password validation:", {
            email: credentials.email,
            storedHash: user.password ? user.password.substring(0, 20) + "..." : null,
            isValid: isPasswordValid,
          })

          if (!isPasswordValid) {
            throw new Error("비밀번호가 올바르지 않습니다.")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error: any) {
          console.error("Authorization error:", error)
          throw new Error(error.message || "로그인 중 오류가 발생했습니다.")
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.callback-url'
        : 'authjs.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.csrf-token'
        : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }: any) {
      // 절대 URL인 경우 그대로 사용
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // 다른 도메인의 URL은 baseUrl로 리다이렉트
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.sub = user.id
        token.email = user.email
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub
      }

      // Google OAuth 사용자를 위해 구독 정보 확인/생성
      if (token.provider === "google" && token.sub) {
        try {
          const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: token.sub },
          })

          if (!existingSubscription) {
            console.log("Creating subscription for Google user:", token.sub)
            await prisma.subscription.create({
              data: {
                userId: token.sub,
                status: "INACTIVE",
                plan: "FREE",
              },
            })
          }
        } catch (error) {
          console.error("Subscription creation error:", error)
        }
      }

      return session
    },
  },
})
