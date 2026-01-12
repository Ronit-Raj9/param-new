/**
 * Verify environment variables are set correctly
 */
import "dotenv/config";

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const envVars: EnvVar[] = [
  { name: "NODE_ENV", required: false, description: "Environment (development/production)" },
  { name: "PORT", required: false, description: "Server port (default: 4000)" },
  { name: "DATABASE_URL", required: true, description: "PostgreSQL connection string" },
  { name: "REDIS_URL", required: true, description: "Redis connection URL" },
  { name: "JWT_SECRET", required: true, description: "JWT signing secret" },
  { name: "PRIVY_APP_ID", required: true, description: "Privy application ID" },
  { name: "PRIVY_APP_SECRET", required: true, description: "Privy application secret" },
  { name: "RPC_URL", required: false, description: "Blockchain RPC URL" },
  { name: "MINTER_PRIVATE_KEY", required: false, description: "Private key for minting (optional)" },
  { name: "STUDENT_RECORDS_CONTRACT", required: false, description: "StudentRecords contract address" },
  { name: "SEMESTER_NFT_CONTRACT", required: false, description: "SemesterNFT contract address" },
];

function verify() {
  console.log("🔍 Verifying environment variables...\n");

  let hasErrors = false;
  const missing: string[] = [];
  const present: string[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    if (value) {
      const masked = envVar.name.includes("SECRET") || envVar.name.includes("KEY") || envVar.name.includes("JWT")
        ? `${value.substring(0, 4)}${"*".repeat(Math.min(value.length - 4, 20))}`
        : value;

      present.push(`✅ ${envVar.name}: ${masked}`);
    } else if (envVar.required) {
      missing.push(`❌ ${envVar.name}: MISSING (${envVar.description})`);
      hasErrors = true;
    } else {
      present.push(`⚠️  ${envVar.name}: Not set (optional - ${envVar.description})`);
    }
  }

  // Print results
  console.log("Present variables:");
  present.forEach((msg) => console.log(`  ${msg}`));

  if (missing.length > 0) {
    console.log("\nMissing required variables:");
    missing.forEach((msg) => console.log(`  ${msg}`));
  }

  // Test database connection
  console.log("\n🔌 Testing connections...\n");

  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log(`  📊 Database: ${url.hostname}:${url.port}${url.pathname}`);
    } catch {
      console.log("  ❌ Database URL is invalid");
      hasErrors = true;
    }
  }

  if (process.env.REDIS_URL) {
    try {
      const url = new URL(process.env.REDIS_URL);
      console.log(`  🔴 Redis: ${url.hostname}:${url.port}`);
    } catch {
      console.log("  ❌ Redis URL is invalid");
      hasErrors = true;
    }
  }

  if (process.env.BLOCKCHAIN_RPC_URL) {
    try {
      const url = new URL(process.env.BLOCKCHAIN_RPC_URL);
      console.log(`  ⛓️  Blockchain RPC: ${url.hostname}`);
    } catch {
      console.log("  ❌ Blockchain RPC URL is invalid");
      hasErrors = true;
    }
  }

  console.log("");

  if (hasErrors) {
    console.log("❌ Environment verification FAILED");
    console.log("   Please set the missing required variables in your .env file");
    process.exit(1);
  } else {
    console.log("✅ Environment verification PASSED");
    process.exit(0);
  }
}

verify();
