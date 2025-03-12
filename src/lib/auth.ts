import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./ds";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { User } from '@/types/user';


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        }) as unknown as User;
        
        if (!user || !user.hashedPassword) {
          return null;
        }
        
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        
        if (!passwordMatch) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
    ,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  }
};