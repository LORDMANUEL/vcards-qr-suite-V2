import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const temporaryPassword = process.env.ADMIN_TEMPORARY_PASSWORD;

  if (!email || !temporaryPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_TEMPORARY_PASSWORD are required");
  }

  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
  const updated = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      isActive: true,
      isSystemUser: true,
    },
    select: { id: true, email: true, role: true, isActive: true },
  });

  console.log(JSON.stringify({ message: "ADMIN_PASSWORD_RESET_OK", user: updated }, null, 2));
}

main()
  .catch((error) => {
    console.error("ADMIN_PASSWORD_RESET_ERROR", error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

