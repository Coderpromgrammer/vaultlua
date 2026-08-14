import { db } from "@/lib/db";

async function test() {
  // Check what profile IDs look like in the existing DB
  const profiles = await db.profile.findMany({ take: 5, select: { id: true, email: true, username: true, role: true } });
  console.log("Existing profiles:", JSON.stringify(profiles, null, 2));

  // Try creating a profile with a Clerk-style ID (Clerk uses "user_" prefix + alphanumeric)
  try {
    const test = await db.profile.create({
      data: {
        id: "user_2abc123def456_clerk_test",
        email: "clerk-test@example.com",
        username: "clerk_test_user_xyz",
        role: "creator",
      },
    });
    console.log("Created profile with custom ID:", test.id);
    await db.profile.delete({ where: { id: test.id } });
    console.log("Cleaned up test profile");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Error creating profile with custom ID:", msg);
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
