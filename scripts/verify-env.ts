import "dotenv/config";
import prisma from "../src/lib/prisma";
import { config } from "../src/config";

async function verifyEnvironment() {
  console.log("🔍 Checking University Management System Environment & Infrastructure...\n");

  const checks = [
    { name: "DATABASE_URL", val: !!config.databaseUrl },
    { name: "JWT_ACCESS_SECRET", val: !!config.jwt.accessSecret },
    { name: "JWT_REFRESH_SECRET", val: !!config.jwt.refreshSecret },
    { name: "STRIPE_SECRET_KEY", val: !!config.stripe.secretKey },
    { name: "GOOGLE_CLIENT_ID", val: !!config.google.clientId },
    { name: "PORT", val: !!config.port },
  ];

  let hasError = false;
  for (const c of checks) {
    if (c.val) {
      console.log(`  ✅ ${c.name}: Configured`);
    } else {
      console.error(`  ❌ ${c.name}: Missing!`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error("\n❌ Environment validation failed.");
    process.exit(1);
  }

  try {
    console.log("\n📡 Pinging PostgreSQL Database via Prisma...");
    const userCount = await prisma.user.count();
    const deptCount = await prisma.academicDepartment.count();
    const courseCount = await prisma.course.count();

    console.log(`  ✅ Database Connected! Users: ${userCount}, Departments: ${deptCount}, Courses: ${courseCount}`);
    console.log("\n🎉 Environment and Database are 100% Ready for Production & Evaluation!\n");
  } catch (error: any) {
    console.error("❌ Database Connection Failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEnvironment();
