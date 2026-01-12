
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🗑️ Clearing all curriculums and related data...");

    // 1. Unlink students from curriculums first
    const students = await prisma.student.updateMany({
        data: { curriculumId: null }
    });
    console.log(`✅ Unlinked ${students.count} students from curriculums`);

    // 2. Delete CourseResults (already done, but safe measure)
    // Course results depend on Course, courses depend on CurriculumSemester
    const courseResults = await prisma.courseResult.deleteMany({});
    console.log(`✅ Deleted ${courseResults.count} course results`);

    // 3. Delete Courses
    const courses = await prisma.course.deleteMany({});
    console.log(`✅ Deleted ${courses.count} courses`);

    // 4. Delete Curriculum Semesters (should cascade from Curriculum, but safe measure)
    const semesters = await prisma.curriculumSemester.deleteMany({});
    console.log(`✅ Deleted ${semesters.count} semesters`);

    // 5. Delete Curriculums
    const curriculums = await prisma.curriculum.deleteMany({});
    console.log(`✅ Deleted ${curriculums.count} curriculums`);

    console.log("🎉 All curriculums removed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Failed to clear curriculums:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
