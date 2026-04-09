
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start resetting database ...`);

  // Clear existing data in the correct order to avoid foreign key constraints
  console.log('Deleting existing data...');
  await prisma.monthlyPayment.deleteMany({});
  await prisma.loanInstallment.deleteMany({});
  await prisma.shareTransfer.deleteMany({});
  await prisma.share.deleteMany({});
  await prisma.guarantor.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.eventPayment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.approvedPayment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.profileUpdate.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.paymentAccount.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.post.deleteMany({});
  console.log('Database has been reset.');
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
