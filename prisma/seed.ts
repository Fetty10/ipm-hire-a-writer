// prisma/seed.ts
// Seeds: Plans, Exception Departments, Pay Rates, First Main Admin
// Run: npm run db:seed

import { PrismaClient, DegreeGroup, PlanName, PricingType, AssigneeRole, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding iProjectMaster database...\n");

  // ── 1. PLANS ─────────────────────────────────────────────────
  console.log("📦 Seeding plans...");

  const plans = [
    // OND / HND / NCE
    { degreeGroup: DegreeGroup.OND_HND_NCE, planName: PlanName.BASIC,           pricingType: PricingType.FLAT,        priceKobo: 1200000, includesCorrections: false, includesFormat: false, includesPlagiarismCheck: false },
    { degreeGroup: DegreeGroup.OND_HND_NCE, planName: PlanName.STANDARD,        pricingType: PricingType.PER_CHAPTER, priceKobo:  700000, includesCorrections: true,  includesFormat: true,  includesPlagiarismCheck: false },
    { degreeGroup: DegreeGroup.OND_HND_NCE, planName: PlanName.PROFESSIONAL,    pricingType: PricingType.PER_CHAPTER, priceKobo: 1200000, includesCorrections: true,  includesFormat: true,  includesPlagiarismCheck: true  },

    // BSc / BEd / BA / BTech / BEng / Nursing
    { degreeGroup: DegreeGroup.BSC_BED_BA,  planName: PlanName.BASIC,           pricingType: PricingType.FLAT,        priceKobo: 1200000, includesCorrections: false, includesFormat: false, includesPlagiarismCheck: false },
    { degreeGroup: DegreeGroup.BSC_BED_BA,  planName: PlanName.STANDARD,        pricingType: PricingType.PER_CHAPTER, priceKobo:  700000, includesCorrections: true,  includesFormat: true,  includesPlagiarismCheck: false },
    { degreeGroup: DegreeGroup.BSC_BED_BA,  planName: PlanName.PROFESSIONAL,    pricingType: PricingType.PER_CHAPTER, priceKobo: 1200000, includesCorrections: true,  includesFormat: true,  includesPlagiarismCheck: true  },

    // PGD / MSc / MBA / MBBS / LL.B / PhD
    { degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.BASIC,           pricingType: PricingType.FLAT,        priceKobo: 2000000, includesCorrections: false, includesFormat: false, includesPlagiarismCheck: false },
    { degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.STANDARD,        pricingType: PricingType.PER_CHAPTER, priceKobo: 1000000, includesCorrections: true,  includesFormat: true,  includesPlagiarismCheck: false },
    { degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PROFESSIONAL,    pricingType: PricingType.PER_CHAPTER, priceKobo: 2000000, includesCorrections: true,  includesFormat: true,  includesPlagiarismCheck: true  },
    { degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PHD_PROFESSIONAL, pricingType: PricingType.PER_CHAPTER, priceKobo: 5000000, includesCorrections: true, includesFormat: true,  includesPlagiarismCheck: true  },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { degreeGroup_planName: { degreeGroup: plan.degreeGroup, planName: plan.planName } },
      update: plan,
      create: { ...plan, isActive: true },
    });
  }
  console.log(`   ✅ ${plans.length} plans seeded\n`);

  // ── 2. PROPOSAL PRICING ──────────────────────────────────────
  console.log("📄 Seeding proposal pricing...");
  const proposalPrices = [
    { degreeGroup: DegreeGroup.OND_HND_NCE, priceKobo: 1000000, deliveryDays: 3 },
    { degreeGroup: DegreeGroup.BSC_BED_BA,  priceKobo: 1000000, deliveryDays: 3 },
    { degreeGroup: DegreeGroup.PGD_MSC_PHD, priceKobo: 2000000, deliveryDays: 3 },
    // PhD (stored under PGD_MSC_PHD — differentiate via plan selection in UI)
  ];

  for (const p of proposalPrices) {
    await prisma.proposalPricing.upsert({
      where: { degreeGroup: p.degreeGroup },
      update: p,
      create: { ...p, isActive: true },
    });
  }
  console.log(`   ✅ Proposal pricing seeded\n`);

  // ── 3. JOURNAL PRICING ───────────────────────────────────────
  console.log("📚 Seeding journal pricing...");
  await prisma.journalPricing.deleteMany(); // clean slate
  await prisma.journalPricing.createMany({
    data: [
      { type: "sourcing", priceKobo: 100000, isActive: true }, // ₦1,000 per item
      { type: "writing",  degreeGroup: DegreeGroup.OND_HND_NCE, priceKobo: 1000000, isActive: true },
      { type: "writing",  degreeGroup: DegreeGroup.BSC_BED_BA,  priceKobo: 1000000, isActive: true },
      { type: "writing",  degreeGroup: DegreeGroup.PGD_MSC_PHD, priceKobo: 2000000, isActive: true },
    ],
  });
  console.log(`   ✅ Journal pricing seeded\n`);

  // ── 4. EXCEPTION DEPARTMENTS ─────────────────────────────────
  console.log("🏛️  Seeding exception departments...");
  const exceptions = [
    "Law", "Philosophy", "Microbiology", "Medicine", "Pharmacy",
    "Biochemistry", "Anatomy", "Physiology", "Dentistry", "Nursing (exception)",
  ];

  for (const name of exceptions) {
    await prisma.exceptionDepartment.upsert({
      where:  { name },
      update: {},
      create: { name },
    });
  }
  console.log(`   ✅ ${exceptions.length} exception departments seeded\n`);

  // ── 5. PAY RATES (default) ───────────────────────────────────
  // You can adjust these from the admin panel later
  console.log("💰 Seeding default pay rates...");

  const payRates = [
    // WRITER rates per chapter per degree group / plan
    // Standard plans
    { role: AssigneeRole.WRITER,  chapterNumber: null, degreeGroup: DegreeGroup.OND_HND_NCE, planName: PlanName.STANDARD,     amountKobo: 200000  },
    { role: AssigneeRole.WRITER,  chapterNumber: null, degreeGroup: DegreeGroup.BSC_BED_BA,  planName: PlanName.STANDARD,     amountKobo: 200000  },
    { role: AssigneeRole.WRITER,  chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.STANDARD,     amountKobo: 300000  },
    // Professional plans
    { role: AssigneeRole.WRITER,  chapterNumber: null, degreeGroup: DegreeGroup.OND_HND_NCE, planName: PlanName.PROFESSIONAL, amountKobo: 350000  },
    { role: AssigneeRole.WRITER,  chapterNumber: null, degreeGroup: DegreeGroup.BSC_BED_BA,  planName: PlanName.PROFESSIONAL, amountKobo: 350000  },
    { role: AssigneeRole.WRITER,  chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PROFESSIONAL, amountKobo: 600000  },
    // PhD Professional
    { role: AssigneeRole.WRITER,  chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PHD_PROFESSIONAL, amountKobo: 1500000 },

    // ANALYST rates
    { role: AssigneeRole.ANALYST, chapterNumber: null, degreeGroup: DegreeGroup.OND_HND_NCE, planName: PlanName.STANDARD,     amountKobo: 200000  },
    { role: AssigneeRole.ANALYST, chapterNumber: null, degreeGroup: DegreeGroup.BSC_BED_BA,  planName: PlanName.STANDARD,     amountKobo: 200000  },
    { role: AssigneeRole.ANALYST, chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.STANDARD,     amountKobo: 300000  },
    { role: AssigneeRole.ANALYST, chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PROFESSIONAL, amountKobo: 600000  },
    { role: AssigneeRole.ANALYST, chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PHD_PROFESSIONAL, amountKobo: 1500000 },

    // QC rates (per chapter checked)
    { role: AssigneeRole.QC, chapterNumber: null, degreeGroup: DegreeGroup.OND_HND_NCE, planName: PlanName.PROFESSIONAL,    amountKobo: 100000 },
    { role: AssigneeRole.QC, chapterNumber: null, degreeGroup: DegreeGroup.BSC_BED_BA,  planName: PlanName.PROFESSIONAL,    amountKobo: 100000 },
    { role: AssigneeRole.QC, chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PROFESSIONAL,    amountKobo: 200000 },
    { role: AssigneeRole.QC, chapterNumber: null, degreeGroup: DegreeGroup.PGD_MSC_PHD, planName: PlanName.PHD_PROFESSIONAL, amountKobo: 500000 },
  ];

  for (const rate of payRates) {
    await prisma.payRate.upsert({
      where: {
        role_chapterNumber_degreeGroup_planName: {
          role:          rate.role,
          chapterNumber: rate.chapterNumber ?? -1,
          degreeGroup:   rate.degreeGroup,
          planName:      rate.planName,
        },
      },
      update: { amountKobo: rate.amountKobo },
      create: rate,
    });
  }
  console.log(`   ✅ ${payRates.length} pay rates seeded\n`);

  // ── 6. MAIN ADMIN ACCOUNT ────────────────────────────────────
  console.log("👤 Creating main admin account...");
  const adminEmail = "admin@iprojectmaster.com";
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    const hashed = await bcrypt.hash("Admin@IPM2025!", 12);
    await prisma.user.create({
      data: {
        name:        "Main Admin",
        email:       adminEmail,
        password:    hashed,
        role:        Role.MAIN_ADMIN,
        isApproved:  true,
        isSuspended: false,
      },
    });
    console.log(`   ✅ Admin created: ${adminEmail} / Admin@IPM2025!`);
    console.log(`   ⚠️  CHANGE THIS PASSWORD immediately after first login!\n`);
  } else {
    console.log(`   ℹ️  Admin already exists, skipped.\n`);
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
