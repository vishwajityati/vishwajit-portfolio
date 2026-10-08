import { defaultContent } from "../src/data/personal";
import { prisma } from "../src/lib/prisma";

async function main() {
  const data = JSON.stringify(defaultContent);

  await prisma.portfolio.upsert({
    where: { id: 1 },
    update: { content: data },
    create: { id: 1, content: data }
  });
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed portfolio data:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
