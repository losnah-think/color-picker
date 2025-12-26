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

// Google OAuth 환경 변수 검증
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

if (process.env.NODE_ENV === 'production') {
  if (!googleClientId || !googleClientSecret) {
    console.warn('Google OAuth not configured in production')
  } else {
    console.log('Google OAuth configured:', { googleClientId: googleClientId.substring(0, 20) + '...' })
  }
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

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password.trim()

        try {
          const user = await prisma.user.findUnique({
            where: { email },
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
            password,
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
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                prompt: "consent",
              },
            },
            profile(profile: any) {
              console.log("Google profile received:", {
                id: profile.id,
                email: profile.email,
                name: profile.name,
              })
              return {
                id: profile.sub || profile.id,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              }
            },
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
        httpOnly: true,
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
      // 상대 경로는 baseUrl과 함께 반환
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // baseUrl과 같은 도메인이면 그대로 사용
      else if (new URL(url).origin === baseUrl) return url
      // 다른 도메인은 baseUrl로 리다이렉트
      return baseUrl
    },
    async signIn({ user, account, profile }: any) {
      // OAuth 프로필 확인
      if (account?.provider === "google") {
        console.log("Google OAuth sign-in:", {
          provider: account.provider,
          email: user.email,
          name: user.name,
          userId: user.id,
        })
        try {
          return true
        } catch (error) {
          console.error("Google sign-in error:", error)
          return false
        }
      }
      return true
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
