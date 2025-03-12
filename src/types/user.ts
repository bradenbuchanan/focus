export interface User {
    id: string;
    name: string | null;
    email: string;
    hashedPassword?: string;
    emailVerified?: Date | null;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }