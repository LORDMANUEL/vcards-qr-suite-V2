import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      branchId?: string | null;
      twoFactorEnabled?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    branchId?: string | null;
    twoFactorEnabled?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    branchId?: string | null;
    twoFactorEnabled?: boolean;
  }
}
