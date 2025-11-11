import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Create sample categories
  const category1 = await prisma.category.upsert({
    where: { name: "Alimentation" },
    update: {},
    create: {
      name: "Alimentation",
      color: "#4CAF50",
    },
  });

  const category2 = await prisma.category.upsert({
    where: { name: "Transport" },
    update: {},
    create: {
      name: "Transport",
      color: "#2196F3",
    },
  });

  console.log("Created categories:", { category1, category2 });
  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
