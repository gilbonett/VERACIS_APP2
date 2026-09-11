import { PrismaClient } from "@generated/client";
import { hash } from "bcryptjs";

const HASH_SALT_LENGTH = 8;

export const USERS = {
  ROOT: {
    id: "2e3d9aa0-57f8-41ea-a97f-3eb3f73e025a",
    status: "ACTIVED",
    role: "MANAGER",
    name: "Root Veracis",
    cpf: "46477239094",
    email: "root@veracis.com",
    phone: "92991110001",
    birthDate: new Date("1985-03-15"),
    isVerified: true,
    otpEnabled: false,
  },
  LEADER_AMAZONIA: {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    status: "ACTIVED",
    role: "MEMBER",
    name: "Carlos Amazonas",
    cpf: "52998224725",
    email: "carlos.amazonas@veracis.com",
    phone: "92992220002",
    birthDate: new Date("1990-07-22"),
    isVerified: true,
    otpEnabled: false,
  },
  LEADER_CERRADO: {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    status: "ACTIVED",
    role: "MEMBER",
    name: "Beatriz Cerrado",
    cpf: "07077902048",
    email: "beatriz.cerrado@veracis.com",
    phone: "61993330003",
    birthDate: new Date("1992-11-05"),
    isVerified: true,
    otpEnabled: false,
  },
  MEMBER_1: {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    status: "ACTIVED",
    role: "LEADER",
    name: "Ana Silva",
    cpf: "71428793860",
    email: "ana.silva@veracis.com",
    phone: "92994440004",
    birthDate: new Date("1998-04-12"),
    isVerified: true,
    otpEnabled: false,
  },
  MEMBER_2: {
    id: "a1b2c3d4-0005-4000-8000-000000000005",
    status: "ACTIVED",
    role: "LEADER",
    name: "Pedro Ribeiro",
    cpf: "87748248800",
    email: "pedro.ribeiro@veracis.com",
    phone: "62995550005",
    birthDate: new Date("1995-09-30"),
    isVerified: false,
    otpEnabled: false,
  },
  MEMBER_3: {
    id: "a1b2c3d4-0006-4000-8000-000000000006",
    status: "ACTIVED",
    role: "MEMBER",
    name: "Mariana Costa",
    cpf: "95587476618",
    email: "mariana.costa@veracis.com",
    phone: "92996660006",
    birthDate: new Date("2001-02-18"),
    isVerified: true,
    otpEnabled: false,
  },
} as const;

export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await hash("Password@123", HASH_SALT_LENGTH);
  const usersToSeed = Object.values(USERS);

  await Promise.all(
    usersToSeed.map((user) =>
      prisma.user.upsert({
        where: { id: user.id },
        update: {
          status: user.status,
          role: user.role,
          name: user.name,
          cpf: user.cpf,
          email: user.email,
          phone: user.phone,
          birthDate: user.birthDate,
          isVerified: user.isVerified,
          otpEnabled: user.otpEnabled,
          password: passwordHash,
        },
        create: {
          ...user,
          lastedLat: 0,
          lastedLng: 0,
          password: passwordHash,
        },
      }),
    ),
    // usersToSeed.map(async (user) => {
    //   try {
    //     await prisma.user.upsert({
    //       where: { id: user.id },
    //       update: {
    //         status: user.status,
    //         role: user.role,
    //         name: user.name,
    //         cpf: user.cpf,
    //         email: user.email,
    //         phone: user.phone,
    //         birthDate: user.birthDate,
    //         isVerified: user.isVerified,
    //         mfaEnabled: user.mfaEnabled,
    //       },
    //       create: {
    //         ...user,
    //         password: passwordHash,
    //       },
    //     });
    //   } catch (err: unknown) {
    //     const message = err instanceof Error ? err.message : String(err);
    //     const isUniqueCpfOrEmail =
    //       message.includes("Unique constraint failed") &&
    //       (message.includes("cpf") || message.includes("email"));

    //     if (!isUniqueCpfOrEmail) {
    //       throw err;
    //     }

    //     const existingByCpf = await prisma.user.findUnique({
    //       where: { cpf: user.cpf },
    //     });
    //     if (existingByCpf) {
    //       await prisma.user.update({
    //         where: { id: existingByCpf.id },
    //         data: {
    //           status: user.status,
    //           role: user.role,
    //           name: user.name,
    //           email: user.email,
    //           phone: user.phone,
    //           birthDate: user.birthDate,
    //           isVerified: user.isVerified,
    //           mfaEnabled: user.mfaEnabled,
    //           password: existingByCpf.password ?? passwordHash,
    //         },
    //       });
    //       return;
    //     }

    //     const existingByEmail = await prisma.user.findUnique({
    //       where: { email: user.email },
    //     });
    //     if (existingByEmail) {
    //       await prisma.user.update({
    //         where: { id: existingByEmail.id },
    //         data: {
    //           status: user.status,
    //           role: user.role,
    //           name: user.name,
    //           cpf: user.cpf,
    //           phone: user.phone,
    //           birthDate: user.birthDate,
    //           isVerified: user.isVerified,
    //           otpEnabled: user.mfaEnabled,
    //           password: existingByEmail.password ?? passwordHash,
    //         },
    //       });
    //       return;
    //     }
    //     throw err;
    //   }
    // }),
  );
}
