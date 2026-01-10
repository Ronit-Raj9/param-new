import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import puppeteer from "puppeteer";
import { prisma } from "../config/database.js";
import { createLogger } from "../utils/logger.js";
import { formatDate } from "../utils/date.js";

const logger = createLogger("pdf-service");

export interface TranscriptData {
  student: {
    name: string;
    enrollmentNo: string;
    dateOfBirth?: Date;
    program: string;
    programCode: string;
    batchYear: number;
  };
  semesters: Array<{
    semester: number;
    academicYear: string;
    sgpa: number;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
      grade: string;
      gradePoints: number;
    }>;
  }>;
  cgpa: number;
  totalCredits: number;
  issuedAt: Date;
  credentialHash: string;
}

/**
 * Generate transcript PDF using Puppeteer
 */
export async function generateTranscriptPDF(data: TranscriptData): Promise<Buffer> {
  const html = generateTranscriptHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    logger.info({ enrollmentNo: data.student.enrollmentNo }, "Transcript PDF generated");
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generate transcript HTML template
 */
function generateTranscriptHTML(data: TranscriptData): string {
  const semesterRows = data.semesters.flatMap((sem) =>
    sem.courses.map((course, idx) => `
      <tr>
        ${idx === 0 ? `<td rowspan="${sem.courses.length}" class="semester-cell">${sem.semester}</td>` : ""}
        <td>${course.code}</td>
        <td>${course.name}</td>
        <td class="center">${course.credits}</td>
        <td class="center">${course.grade}</td>
        <td class="center">${course.gradePoints.toFixed(2)}</td>
        ${idx === 0 ? `<td rowspan="${sem.courses.length}" class="center sgpa-cell">${sem.sgpa.toFixed(2)}</td>` : ""}
      </tr>
    `)
  ).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .institution {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .document-title {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 10px;
          text-transform: uppercase;
        }
        .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
          background: #f9f9f9;
        }
        .info-row {
          display: flex;
        }
        .info-label {
          font-weight: bold;
          width: 140px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background: #f0f0f0;
          font-weight: bold;
        }
        .center {
          text-align: center;
        }
        .semester-cell {
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        .sgpa-cell {
          vertical-align: middle;
          font-weight: bold;
        }
        .summary {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background: #f0f0f0;
          border: 1px solid #000;
        }
        .summary-item {
          text-align: center;
        }
        .summary-label {
          font-size: 10pt;
          color: #666;
        }
        .summary-value {
          font-size: 14pt;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin-top: 50px;
          padding-top: 5px;
        }
        .verification {
          margin-top: 30px;
          font-size: 9pt;
          color: #666;
          border-top: 1px dashed #ccc;
          padding-top: 10px;
        }
        .hash {
          font-family: monospace;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="institution">IIITM GWALIOR</div>
        <div>ABV-Indian Institute of Information Technology and Management</div>
        <div>Gwalior, Madhya Pradesh, India</div>
        <div class="document-title">Official Academic Transcript</div>
      </div>

      <div class="student-info">
        <div class="info-row">
          <span class="info-label">Student Name:</span>
          <span>${data.student.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Enrollment No:</span>
          <span>${data.student.enrollmentNo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Program:</span>
          <span>${data.student.program} (${data.student.programCode})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Batch Year:</span>
          <span>${data.student.batchYear}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="center">Sem</th>
            <th>Course Code</th>
            <th>Course Name</th>
            <th class="center">Credits</th>
            <th class="center">Grade</th>
            <th class="center">Points</th>
            <th class="center">SGPA</th>
          </tr>
        </thead>
        <tbody>
          ${semesterRows}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Total Credits Earned</div>
          <div class="summary-value">${data.totalCredits}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Cumulative Grade Point Average (CGPA)</div>
          <div class="summary-value">${data.cgpa.toFixed(2)}</div>
        </div>
      </div>

      <div class="footer">
        <div class="signature-block">
          <div class="signature-line">Controller of Examinations</div>
        </div>
        <div class="signature-block">
          <div class="signature-line">Director</div>
        </div>
      </div>

      <div class="verification">
        <p>Issued on: ${formatDate(data.issuedAt)}</p>
        <p>Document Hash: <span class="hash">${data.credentialHash}</span></p>
        <p>This document can be verified at: https://param.iiitm.ac.in/verify</p>
      </div>
    </body>
    </html>
  `;
}

export interface CertificateData {
  student: {
    name: string;
    enrollmentNo: string;
    program: string;
    degreeType: string;
    specialization?: string;
  };
  cgpa: number;
  graduationDate: Date;
  issuedAt: Date;
  credentialHash: string;
}

/**
 * Generate degree certificate PDF
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const html = generateCertificateHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });

    logger.info({ enrollmentNo: data.student.enrollmentNo }, "Certificate PDF generated");
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generate certificate HTML template
 */
function generateCertificateHTML(data: CertificateData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          text-align: center;
          background: linear-gradient(135deg, #f5f5dc 0%, #fff8dc 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .certificate {
          border: 15px double #8B4513;
          padding: 50px;
          background: white;
          max-width: 900px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          margin-bottom: 30px;
        }
        .institution {
          font-size: 28pt;
          font-weight: bold;
          color: #8B4513;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 12pt;
          color: #666;
        }
        .title {
          font-size: 24pt;
          font-weight: bold;
          color: #2c3e50;
          margin: 30px 0;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        .content {
          font-size: 14pt;
          line-height: 2;
          margin: 30px 0;
        }
        .student-name {
          font-size: 22pt;
          font-weight: bold;
          color: #2c3e50;
          border-bottom: 2px solid #8B4513;
          display: inline-block;
          padding: 5px 30px;
          margin: 10px 0;
        }
        .degree {
          font-size: 18pt;
          font-weight: bold;
          color: #8B4513;
          margin: 15px 0;
        }
        .cgpa {
          font-size: 14pt;
          margin: 20px 0;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding: 0 50px;
        }
        .signature-block {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin-top: 60px;
          padding-top: 10px;
        }
        .verification {
          margin-top: 40px;
          font-size: 9pt;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <div class="institution">IIITM GWALIOR</div>
          <div class="subtitle">ABV-Indian Institute of Information Technology and Management</div>
          <div class="subtitle">Gwalior, Madhya Pradesh, India</div>
        </div>

        <div class="title">Degree Certificate</div>

        <div class="content">
          <p>This is to certify that</p>
          <div class="student-name">${data.student.name}</div>
          <p>Enrollment No: ${data.student.enrollmentNo}</p>
          <p>has successfully completed all the requirements for the degree of</p>
          <div class="degree">${data.student.degreeType}</div>
          <p>in ${data.student.program}${data.student.specialization ? ` with specialization in ${data.student.specialization}` : ""}</p>
          <p class="cgpa">with a Cumulative Grade Point Average (CGPA) of <strong>${data.cgpa.toFixed(2)}</strong></p>
        </div>

        <div class="signatures">
          <div class="signature-block">
            <div class="signature-line">Controller of Examinations</div>
          </div>
          <div class="signature-block">
            <div class="signature-line">Director</div>
          </div>
        </div>

        <div class="verification">
          <p>Date of Issue: ${formatDate(data.issuedAt)}</p>
          <p>Verification: ${data.credentialHash.substring(0, 20)}...</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
