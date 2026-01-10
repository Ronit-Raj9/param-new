import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("csv-service");

// Type for parsed CSV row
type CsvRow = Record<string, string>;

export interface ParsedResultRow {
  enrollmentNumber: string;
  courseCode: string;
  marksObtained: number;
}

export interface ParsedStudentRow {
  enrollmentNumber: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
}

/**
 * Parse results CSV
 */
export function parseResultsCSV(csvContent: string): ParsedResultRow[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    return records.map((row) => {
      const enrollmentNumber = row.enrollment_no || row.enrollmentNo || row.enrollment_number || row.enrollmentNumber || row.roll_no || row.rollNo;
      const courseCode = row.course_code || row.courseCode || row.subject_code || row.subjectCode;
      const marks = row.marks || row.marks_obtained || row.marksObtained || row.score;

      if (!enrollmentNumber || !courseCode || marks === undefined) {
        throw new Error(`Missing required fields in row: ${JSON.stringify(row)}`);
      }

      return {
        enrollmentNumber: String(enrollmentNumber).trim(),
        courseCode: String(courseCode).trim().toUpperCase(),
        marksObtained: parseFloat(marks),
      };
    });
  } catch (error) {
    logger.error({ error }, "Failed to parse results CSV");
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Parse students CSV
 */
export function parseStudentsCSV(csvContent: string): ParsedStudentRow[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    return records.map((row) => {
      const enrollmentNumber = row.enrollment_no || row.enrollmentNo || row.enrollment_number || row.enrollmentNumber || row.roll_no || row.rollNo;
      const name = row.name || row.student_name || row.studentName;
      const email = row.email || row.student_email || row.studentEmail;

      if (!enrollmentNumber || !name || !email) {
        throw new Error(`Missing required fields in row: ${JSON.stringify(row)}`);
      }

      return {
        enrollmentNumber: String(enrollmentNumber).trim(),
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        dateOfBirth: row.dob || row.date_of_birth || row.dateOfBirth || undefined,
        phone: row.phone || row.mobile || row.contact || undefined,
      };
    });
  } catch (error) {
    logger.error({ error }, "Failed to parse students CSV");
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Validate results CSV structure
 */
export function validateResultsCSV(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    if (records.length === 0) {
      errors.push("CSV file is empty");
      return { valid: false, errors };
    }

    const firstRow = records[0]!;
    const hasEnrollment = firstRow.enrollment_no || firstRow.enrollmentNo || firstRow.enrollment_number || firstRow.enrollmentNumber || firstRow.roll_no || firstRow.rollNo;
    const hasCourse = firstRow.course_code || firstRow.courseCode || firstRow.subject_code || firstRow.subjectCode;
    const hasMarks = firstRow.marks || firstRow.marks_obtained || firstRow.marksObtained || firstRow.score;

    if (!hasEnrollment) errors.push("Missing enrollment number column");
    if (!hasCourse) errors.push("Missing course code column");
    if (!hasMarks) errors.push("Missing marks column");

    // Validate each row
    records.forEach((row, index) => {
      const marks = parseFloat(row.marks || row.marks_obtained || row.marksObtained || row.score || "");
      if (isNaN(marks) || marks < 0 || marks > 100) {
        errors.push(`Row ${index + 2}: Invalid marks value`);
      }
    });

    return { valid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`CSV parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { valid: false, errors };
  }
}

/**
 * Generate results CSV template
 */
export function generateResultsTemplate(): string {
  const headers = ["enrollment_number", "course_code", "marks"];
  const sampleData = [
    { enrollment_number: "2020BTCS001", course_code: "CS301", marks: "85" },
    { enrollment_number: "2020BTCS002", course_code: "CS301", marks: "92" },
  ];

  return stringify(sampleData, { header: true, columns: headers });
}

/**
 * Generate students CSV template
 */
export function generateStudentsTemplate(): string {
  const headers = ["enrollment_number", "name", "email", "date_of_birth", "phone"];
  const sampleData = [
    {
      enrollment_number: "2020BTCS001",
      name: "John Doe",
      email: "john.doe@example.com",
      date_of_birth: "2002-01-15",
      phone: "9876543210",
    },
    {
      enrollment_number: "2020BTCS002",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      date_of_birth: "2001-08-20",
      phone: "9876543211",
    },
  ];

  return stringify(sampleData, { header: true, columns: headers });
}

/**
 * Export results to CSV
 */
export function exportResultsToCSV(
  results: Array<{
    enrollmentNumber: string;
    courseCode: string;
    courseName: string;
    marks: number;
    grade: string;
    gradePoints: number;
    credits: number;
  }>
): string {
  return stringify(results, {
    header: true,
    columns: [
      { key: "enrollmentNumber", header: "Enrollment Number" },
      { key: "courseCode", header: "Course Code" },
      { key: "courseName", header: "Course Name" },
      { key: "marks", header: "Marks" },
      { key: "grade", header: "Grade" },
      { key: "gradePoints", header: "Grade Points" },
      { key: "credits", header: "Credits" },
    ],
  });
}

/**
 * Export students to CSV
 */
export function exportStudentsToCSV(
  students: Array<{
    enrollmentNumber: string;
    name: string;
    email: string;
    program: string;
    batch: string;
    status: string;
    cgpa?: number;
  }>
): string {
  return stringify(students, {
    header: true,
    columns: [
      { key: "enrollmentNumber", header: "Enrollment Number" },
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "program", header: "Program" },
      { key: "batch", header: "Batch" },
      { key: "status", header: "Status" },
      { key: "cgpa", header: "CGPA" },
    ],
  });
}
