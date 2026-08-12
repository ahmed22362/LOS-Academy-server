import assert from 'node:assert';
import { GradeOptions } from '../db/models/report.model';
import { generateReportPDF } from './generateReportPDF';

async function testArabicReportPDF() {
  const pdf = await generateReportPDF({
    id: 2326,
    title: 'Session 3803 Report',
    grade: GradeOptions.EXCELLENT,
    comment: 'مراجعه من سورة الفاتحة : سورة الضحي',
    reportCourses: [
      {
        courseName: 'Arabic language',
        courseGrade: GradeOptions.EXCELLENT,
        courseComment: 'قراءة سورة النازعات 18' as any,
      },
    ],
    createdAt: new Date('2026-08-11T20:31:39Z'),
    user: { name: 'Ann Hassan', email: 'test@example.com' },
    teacher: { name: 'Doaa Mohamed Saber' },
  });

  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert(pdf.includes(Buffer.from('/FontFile2')), 'Unicode font was not embedded');
}

testArabicReportPDF().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
