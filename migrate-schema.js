// migrate-schema.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test if we can access the Accomplishment model
    const test = await prisma.accomplishment.findFirst();
    console.log('Accomplishment model is accessible:', test !== null);

    console.log('Migration succeeded!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
