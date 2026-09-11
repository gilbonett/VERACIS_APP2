import "dotenv/config";

import { PrismaClient } from "@generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import Redis from "ioredis";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { Slug } from "../src/domain/common/value-objects/slug-vo";
import { envSchema } from "../src/infra/env/env";
import { BIOMES } from "./seeds/biomes";
import { COMMUNITIES } from "./seeds/communities";
import { MEMBERSHIPS } from "./seeds/memberships";
import { seedTerms } from "./seeds/terms";
import { seedUsers, USERS } from "./seeds/users";

const env = envSchema.parse(process.env);

const isProduction = env.NODE_ENV === "production";
const connectionString = env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ...(isProduction && {
    ssl: { rejectUnauthorized: false },
  }),
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── IDs fixos para garantir idempotência ────────────────────────────────────

const IDS = {
  // Categorias
  CAT_CLIMATICO: "b1b2c3d4-0001-4000-8000-000000000001",
  CAT_AMBIENTAL: "b1b2c3d4-0002-4000-8000-000000000002",
  CAT_INFRAESTRUTURA: "b1b2c3d4-0003-4000-8000-000000000003",
  CAT_SAUDE: "b1b2c3d4-0004-4000-8000-000000000004",

  // Biomas
  BIOME_AMAZONIA: "c1b2c3d4-0001-4000-8000-000000000001",
  BIOME_CERRADO: "c1b2c3d4-0002-4000-8000-000000000002",
  BIOME_CAATINGA: "c1b2c3d4-0003-4000-8000-000000000003",

  // Comunidades
  COM_VERACIS: "d1b2c3d4-0001-4000-8000-000000000001",
  COM_FLORESTA_NORTE: "d1b2c3d4-0002-4000-8000-000000000002",
  COM_RIO_NEGRO: "d1b2c3d4-0003-4000-8000-000000000003",
  COM_PLANALTO: "d1b2c3d4-0004-4000-8000-000000000004",
  COM_CHAPADA: "d1b2c3d4-0005-4000-8000-000000000005",
  COM_SERTAO: "d1b2c3d4-0006-4000-8000-000000000006",
} as const;

async function seedCategories() {
  console.log("Criando categorias...");

  await prisma.category.upsert({
    where: { id: IDS.CAT_CLIMATICO },
    update: {},
    create: {
      id: IDS.CAT_CLIMATICO,
      name: "Climático",
      description:
        "Eventos relacionados a fenômenos climáticos extremos como secas, tempestades e enchentes.",
      icon: "cloud-lightning",
    },
  });

  await prisma.category.upsert({
    where: { id: IDS.CAT_AMBIENTAL },
    update: {},
    create: {
      id: IDS.CAT_AMBIENTAL,
      name: "Ambiental",
      description:
        "Eventos causados por ação humana no meio ambiente, como desmatamento, queimadas e poluição.",
      icon: "leaf",
    },
  });

  await prisma.category.upsert({
    where: { id: IDS.CAT_INFRAESTRUTURA },
    update: {},
    create: {
      id: IDS.CAT_INFRAESTRUTURA,
      name: "Infraestrutura",
      description:
        "Falhas em serviços essenciais como água, energia, saneamento e vias de acesso.",
      icon: "hard-hat",
    },
  });

  await prisma.category.upsert({
    where: { id: IDS.CAT_SAUDE },
    update: {},
    create: {
      id: IDS.CAT_SAUDE,
      name: "Saúde",
      description:
        "Sintomas e sinais relatados pela comunidade para monitoramento por agentes de saúde.",
      icon: "1010",
    },
  });

  console.log("categorias criadas");
}

async function seedEvents() {
  console.log("⚡ Criando eventos...");

  const climaticAlerts = [
    { icon: "4000", name: "Vento Forte" },
    { icon: "4001", name: "Chuva Forte" },
    { icon: "4002", name: "Tempestade Severa" },
    { icon: "4003", name: "Granizo (Pedras de Gelo)" },
    { icon: "4004", name: "Raios e Trovões" },
    { icon: "4005", name: "Tornado ou Furacão" },
    { icon: "4006", name: "Mar Agitado (Ressaca)" },
    { icon: "4007", name: "Frio Intenso" },
    { icon: "4008", name: "Calor Intenso" },
    { icon: "4009", name: "Seca ou Estiagem" },
    { icon: "4010", name: "Incêndio" },
    { icon: "4011", name: "Fumaça" },
    { icon: "4012", name: "Ar Seco" },
    { icon: "4013", name: "Árvore Caída" },
    { icon: "4014", name: "Outro" },
  ];

  const ambientais = [
    { name: "Descarte irregular de lixo", icon: "trash-2" },
    { name: "Desmatamento", icon: "axe" },
    { name: "Queimada", icon: "flame" },
    { name: "Mineração ilegal", icon: "pickaxe" },
    { name: "Ataque de animais silvestres", icon: "paw-print" },
    { name: "Poluição de rio ou lago", icon: "fish" },
    { name: "Contaminação do solo", icon: "flask-conical" },
  ];

  const infraestrutura = [
    { name: "Falta de água", icon: "droplet-off" },
    { name: "Água barrenta ou imprópria", icon: "alert-triangle" },
    { name: "Esgoto a céu aberto", icon: "pipe" },
    { name: "Alagamento urbano", icon: "house-flood" },
    { name: "Ruptura de tubulação", icon: "wrench" },
    { name: "Falta de energia elétrica", icon: "zap-off" },
    { name: "Ponte ou estrada danificada", icon: "construction" },
    { name: "Falta de coleta de lixo", icon: "trash" },
  ];

  const upsertEvents = async (
    list: { name: string; icon: string }[],
    categoryId: string,
  ) => {
    await Promise.all(
      list.map(({ name, icon }) =>
        prisma.event.upsert({
          where: { slug: Slug.createFromText(name).value },
          update: {},
          create: {
            id: randomUUID(),
            name,
            slug: Slug.createFromText(name).value,
            icon,
            categoryId,
          },
        }),
      ),
    );
  };

  await Promise.all(
    climaticAlerts.map(async ({ icon, name }) => {
      const id = `f0e79a10-0000-4000-8000-00000000${icon}`;
      const slug = Slug.createFromText(`climatic icon ${icon}`).value;
      return prisma.event.upsert({
        where: { id },
        update: {
          name,
          icon,
          slug,
          categoryId: IDS.CAT_CLIMATICO,
        },
        create: {
          id,
          name,
          slug,
          icon,
          categoryId: IDS.CAT_CLIMATICO,
        },
      });
    }),
  );

  const climaticRiskSituations = [
    { icon: "5000", name: "Desaparecidos" },
    { icon: "5001", name: "Desabrigados" },
    { icon: "5002", name: "Desalojado" },
    { icon: "5003", name: "Feridos" },
    { icon: "5004", name: "Risco à vida" },
    { icon: "5005", name: "Outro (risco)" },
  ];

  await Promise.all(
    climaticRiskSituations.map(async ({ icon, name }) => {
      const id = `f0e79a10-0000-4000-8000-00000000${icon}`;
      const slug = Slug.createFromText(`climatic risk icon ${icon}`).value;
      return prisma.event.upsert({
        where: { id },
        update: {
          name,
          icon,
          slug,
          categoryId: IDS.CAT_CLIMATICO,
        },
        create: {
          id,
          name,
          slug,
          icon,
          categoryId: IDS.CAT_CLIMATICO,
        },
      });
    }),
  );

  const environmentalSvgAlerts = [
    { icon: "5000", name: "Morte de Animais" },
    { icon: "5001", name: "Redução de caça" },
    { icon: "5002", name: "Redução de pesca" },
    { icon: "5003", name: "Ataque de animais" },
    { icon: "5004", name: "Incêndio florestal" },
    { icon: "5005", name: "Desmatamento" },
    { icon: "5007", name: "Outro" },
  ];

  await Promise.all(
    environmentalSvgAlerts.map(async ({ icon, name }, index) => {
      const suffix = index.toString(16).padStart(3, "0");
      const id = `f0e79a10-0000-4000-8000-00000000e${suffix}`;
      const slug = Slug.createFromText(`environmental icon ${icon}`).value;
      return prisma.event.upsert({
        where: { id },
        update: {
          name,
          icon,
          slug,
          categoryId: IDS.CAT_AMBIENTAL,
        },
        create: {
          id,
          name,
          slug,
          icon,
          categoryId: IDS.CAT_AMBIENTAL,
        },
      });
    }),
  );

  await upsertEvents(ambientais, IDS.CAT_AMBIENTAL);

  const structuralSvgAlerts = [
    { icon: "6000", name: "Falta de iluminação" },
    { icon: "6001", name: "Falta de saneamento" },
    { icon: "6002", name: "Entulho ou lixo" },
    { icon: "6003", name: "Ponte danificada" },
    { icon: "6004", name: "Construção" },
    { icon: "6005", name: "Outro" },
  ];

  await Promise.all(
    structuralSvgAlerts.map(async ({ icon, name }, index) => {
      const suffix = index.toString(16).padStart(3, "0");
      const id = `f0e79a10-0000-4000-8000-00000000f${suffix}`;
      const slug = Slug.createFromText(`structural icon ${icon}`).value;
      return prisma.event.upsert({
        where: { id },
        update: {
          name,
          icon,
          slug,
          categoryId: IDS.CAT_INFRAESTRUTURA,
        },
        create: {
          id,
          name,
          slug,
          icon,
          categoryId: IDS.CAT_INFRAESTRUTURA,
        },
      });
    }),
  );

  await upsertEvents(infraestrutura, IDS.CAT_INFRAESTRUTURA);

  const saudeSintomas = [
    { icon: "2020", name: "Febre" },
    { icon: "2021", name: "Calafrios" },
    { icon: "2022", name: "Fraqueza" },
    { icon: "2023", name: "Diarréia" },
    { icon: "2024", name: "Enjôo" },
    { icon: "2025", name: "Vômito" },
    { icon: "2026", name: "Tontura" },
    { icon: "2027", name: "Tosse" },
    { icon: "2028", name: "Convulsão" },
    { icon: "2029", name: "Desmaio" },
    { icon: "2030", name: "Dor no corpo" },
    { icon: "2031", name: "Dor na cabeça" },
    { icon: "2032", name: "Dor na garganta" },
    { icon: "2033", name: "Dor na barriga" },
    { icon: "2034", name: "Dores musculares" },
  ];

  await Promise.all(
    saudeSintomas.map(async ({ icon, name }) => {
      const id = `f0e79a10-0000-4000-8000-00000000${icon}`;
      const slug = Slug.createFromText(`health icon ${icon}`).value;
      return prisma.event.upsert({
        where: { id },
        update: {
          name,
          icon,
          slug,
          categoryId: IDS.CAT_SAUDE,
        },
        create: {
          id,
          name,
          slug,
          icon,
          categoryId: IDS.CAT_SAUDE,
        },
      });
    }),
  );

  console.log(
    ` ${climaticAlerts.length + climaticRiskSituations.length + environmentalSvgAlerts.length + structuralSvgAlerts.length + ambientais.length + infraestrutura.length + saudeSintomas.length} eventos criados`,
  );
}

async function seedRisks() {
  const rows = [
    { id: "e1b2c3d4-5000-4000-8000-000000005000", name: "Desaparecidos" },
    { id: "e1b2c3d4-5001-4000-8000-000000005001", name: "Desabrigados" },
    { id: "e1b2c3d4-5002-4000-8000-000000005002", name: "Desalojado" },
    { id: "e1b2c3d4-5003-4000-8000-000000005003", name: "Feridos" },
    { id: "e1b2c3d4-5004-4000-8000-000000005004", name: "Risco à vida" },
    { id: "e1b2c3d4-5005-4000-8000-000000005005", name: "Outro (risco)" },
  ] as const;

  await Promise.all(
    rows.map(({ id, name }) => {
      const slug = Slug.createFromText(name).value;
      return prisma.risk.upsert({
        where: { slug },
        update: { name },
        create: {
          id,
          name,
          slug,
          description: null,
          url: null,
        },
      });
    }),
  );

  console.info(`${rows.length} risco(s) verificado(s)/criado(s)`);
}

async function seedBiomes() {
  const biomesToSeed = Object.values(BIOMES);

  await Promise.all([
    ...biomesToSeed.map((biome) =>
      prisma.biome.upsert({
        where: { id: biome.id },
        update: {},
        create: biome,
      }),
    ),
  ]);

  console.info(`✅ ${biomesToSeed.length} bioma(s) verificado(s)/criado(s)`);
}

async function seedCommunities() {
  const communitiesToSeed = Object.values(COMMUNITIES);

  const root =
    (await prisma.user.findUnique({ where: { email: "root@veracis.com" } })) ??
    (await prisma.user.findUnique({
      where: { id: "2e3d9aa0-57f8-41ea-a97f-3eb3f73e025a" },
    }));
  const authorId = root?.id ?? "2e3d9aa0-57f8-41ea-a97f-3eb3f73e025a";

  await Promise.all(
    communitiesToSeed.map((community) =>
      prisma.community.upsert({
        where: { id: community.id },
        update: {
          name: community.name,
          slug: community.slug,
          lat: community.lat,
          lng: community.lng,
          biomeId: community.biomeId,
          authorId,
        },
        create: { ...community, authorId },
      }),
    ),
  );

  console.info(
    `✅ ${communitiesToSeed.length} comunidade(s) verificada(s)/criada(s)`,
  );
}

async function seedMemberships() {
  const root =
    (await prisma.user.findUnique({ where: { email: "root@veracis.com" } })) ??
    (await prisma.user.findUnique({
      where: { id: "2e3d9aa0-57f8-41ea-a97f-3eb3f73e025a" },
    }));
  const rootId = root?.id ?? "2e3d9aa0-57f8-41ea-a97f-3eb3f73e025a";

  const resolvedMemberships = MEMBERSHIPS.map((membership) => ({
    userId:
      membership.userId === "2e3d9aa0-57f8-41ea-a97f-3eb3f73e025a"
        ? rootId
        : membership.userId,
    communityId: membership.communityId,
  }));

  const userIds = [...new Set(resolvedMemberships.map((m) => m.userId))];

  await Promise.all(
    userIds.map(async (userId) => {
      const allowedCommunityIds = resolvedMemberships
        .filter((m) => m.userId === userId)
        .map((m) => m.communityId);

      await prisma.membership.deleteMany({
        where: {
          userId,
          communityId: { notIn: allowedCommunityIds },
        },
      });
    }),
  );

  await Promise.all(
    resolvedMemberships.map((membership) =>
      prisma.membership.upsert({
        where: {
          userId_communityId: {
            userId: membership.userId,
            communityId: membership.communityId,
          },
        },
        update: {},
        create: membership,
      }),
    ),
  );

  console.info(
    `${resolvedMemberships.length} membership(s) verificado(s)/criado(s)`,
  );
}

async function invalidateUserProfileCache(userIds: string[]) {
  const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: 0,
    keyPrefix: "app:cache:",
  });

  try {
    const keys = userIds.map((id) => `users:${id}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    console.info(
      `Cache de perfil invalidado para ${keys.length} usuário(s)`,
    );
  } catch (error) {
    console.warn(
      "Redis indisponível — faça logout/login ou reinicie o Redis para ver comunidade atualizada:",
      error,
    );
  } finally {
    await redis.quit();
  }
}

async function main() {
  console.info("🌱Iniciando seed do banco de dados...\n");

  await seedTerms(prisma);
  await seedUsers(prisma);
  await seedCategories();
  await seedEvents();
  await seedRisks();
  await seedBiomes();
  await seedCommunities();
  await seedMemberships();

  await invalidateUserProfileCache(
    Object.values(USERS).map((user) => user.id),
  );

  console.info("\n✅ Seed concluído com sucesso!\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("\n❌ Erro durante o seed:");
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
