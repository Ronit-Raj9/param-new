
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🗑️ Clearing all courses...");

    // 1. Delete CourseResults first (due to FK constraint)
    const results = await prisma.courseResult.deleteMany({});
    console.log(`✅ Deleted ${results.count} course results`);

    // 2. Delete Courses
    const courses = await prisma.course.deleteMany({});
    console.log(`✅ Deleted ${courses.count} courses`);

    console.log("🎉 All courses removed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Failed to clear courses:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
