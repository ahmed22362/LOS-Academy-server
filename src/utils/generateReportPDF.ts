import PDFDocument from 'pdfkit';
import Report, { GradeOptions, ReportsCourses } from '../db/models/report.model';
import logger from './logger';

interface ReportData {
  id: number;
  title?: string;
  grade: GradeOptions;
  comment?: string;
  reportCourses: ReportsCourses[];
  createdAt: Date;
  user?: {
    name: string;
    email: string;
  };
  teacher?: {
    name: string;
  };
}

export const generateReportPDF = async (report: ReportData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Colors
      const primaryColor = '#25D366';
      const darkGray = '#333';
      const lightGray = '#F5F5F5';
      const borderColor = '#DDD';

      // Header with background
      doc
        .rect(0, 0, doc.page.width, 80)
        .fill(primaryColor);

      doc
        .fontSize(28)
        .fillColor('#FFF')
        .text('Session Report', 50, 25, { align: 'center' })
        .fontSize(10)
        .text(`Report #${report.id} | ${new Date(report.createdAt).toLocaleDateString()}`, { align: 'center' });

      doc.moveDown(3);

      // Title Section
      if (report.title) {
        doc
          .fontSize(18)
          .fillColor(darkGray)
          .text(report.title, { align: 'center' })
          .moveDown(1.5);
      }

      // Student & Teacher Info Card
      const cardY = doc.y;
      const cardHeight = 80;
      
      // Card background
      doc
        .roundedRect(50, cardY, doc.page.width - 100, cardHeight, 5)
        .fill(lightGray);

      doc
        .fontSize(12)
        .fillColor(darkGray)
        .font('Helvetica-Bold')
        .text('Student Information', 70, cardY + 15)
        .font('Helvetica')
        .fontSize(10)
        .text(`Name: ${report.user?.name || 'N/A'}`, 70, cardY + 35)
        .text(`Email: ${report.user?.email || 'N/A'}`, 70, cardY + 50);

      if (report.teacher?.name) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Teacher', doc.page.width - 250, cardY + 15)
          .font('Helvetica')
          .fontSize(10)
          .text(report.teacher.name, doc.page.width - 250, cardY + 35);
      }

      doc.y = cardY + cardHeight + 20;

      // Overall Grade Section with Badge
      doc
        .fontSize(14)
        .fillColor(darkGray)
        .font('Helvetica-Bold')
        .text('Overall Grade', { align: 'center' })
        .moveDown(0.5);

      const gradeColor = getGradeColor(report.grade);
      const gradeY = doc.y;
      
      // Grade badge
      doc
        .roundedRect(doc.page.width / 2 - 60, gradeY, 120, 50, 20)
        .fill(gradeColor);

      doc
        .fontSize(18)
        .fillColor('#FFF')
        .font('Helvetica-Bold')
        .text(report.grade.toUpperCase(), doc.page.width / 2 - 60, gradeY + 15, {
          width: 120,
          align: 'center',
        });

      doc.y = gradeY + 60;

      // Course Performance Table
      if (report.reportCourses && report.reportCourses.length > 0) {
        doc
          .fontSize(14)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Course Performance', 50)
          .moveDown(1);

        // Table setup
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = {
          no: 30,
          course: 250,
          grade: 100,
          comment: 115,
        };
        const rowHeight = 35;

        // Table header
        doc
          .rect(tableLeft, tableTop, doc.page.width - 100, 30)
          .fill(darkGray);

        doc
          .fontSize(10)
          .fillColor('#FFF')
          .font('Helvetica-Bold')
          .text('#', tableLeft + 5, tableTop + 10, { width: colWidths.no })
          .text('Course Name', tableLeft + colWidths.no + 5, tableTop + 10, { width: colWidths.course })
          .text('Grade', tableLeft + colWidths.no + colWidths.course + 5, tableTop + 10, { width: colWidths.grade })
          .text('Comment', tableLeft + colWidths.no + colWidths.course + colWidths.grade + 5, tableTop + 10, { width: colWidths.comment });

        // Table rows
        let currentY = tableTop + 30;

        report.reportCourses.forEach((course, index) => {
          const isEven = index % 2 === 0;
          const courseGradeColor = getGradeColor(course.courseGrade);

          // Row background (alternating)
          if (isEven) {
            doc
              .rect(tableLeft, currentY, doc.page.width - 100, rowHeight)
              .fill(lightGray);
          }

          // Row content
          doc
            .fontSize(9)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(`${index + 1}`, tableLeft + 5, currentY + 10, { width: colWidths.no })
            .text(course.courseName, tableLeft + colWidths.no + 5, currentY + 10, { width: colWidths.course });

          // Grade badge in table
          const gradeBadgeX = tableLeft + colWidths.no + colWidths.course + 15;
          doc
            .roundedRect(gradeBadgeX, currentY + 10, 70, 20, 10)
            .fill(courseGradeColor);

          doc
            .fontSize(8)
            .fillColor('#FFF')
            .font('Helvetica-Bold')
            .text(course.courseGrade.toUpperCase(), gradeBadgeX, currentY + 11, {
              width: 70,
              align: 'center',
            });

          doc
            .fontSize(8)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(
              course.courseComment || '-',
              tableLeft + colWidths.no + colWidths.course + colWidths.grade + 5,
              currentY + 10,
              { width: colWidths.comment, lineBreak: true }
            );

          // Row border
          doc
            .strokeColor(borderColor)
            .lineWidth(0.5)
            .moveTo(tableLeft, currentY + rowHeight)
            .lineTo(tableLeft + doc.page.width - 100, currentY + rowHeight)
            .stroke();

          currentY += rowHeight;
        });

        doc.y = currentY + 10;
      }

      // Comments Section
      if (report.comment) {
        doc.moveDown(1);
        
        const commentY = doc.y;
        doc
          .roundedRect(50, commentY, doc.page.width - 100, 100, 5)
          .fill(lightGray);

        doc
          .fontSize(12)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Teacher Comments', 70, commentY + 15)
          .font('Helvetica')
          .fontSize(10)
          .text(report.comment, 70, commentY + 35, {
            width: doc.page.width - 140,
            align: 'justify',
            lineGap: 3,
          });

        doc.y = commentY + 120;
      }

      // Footer
      const footerY = doc.page.height - 100;
      doc
        .fontSize(8)
        .fillColor('#999')
        .font('Helvetica')
        .text('LOS Academy - Session Report', 50, footerY, { align: 'center' })
        .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (error: any) {
      logger.error(`Error generating PDF: ${error.message}`);
      reject(error);
    }
  });
};

const getGradeColor = (grade: GradeOptions): string => {
  switch (grade) {
    case GradeOptions.EXCELLENT:
      return '#00C851'; // Green
    case GradeOptions.VERY_GOOD:
      return '#2196F3'; // Blue
    case GradeOptions.GOOD:
      return '#4CAF50'; // Light Green
    case GradeOptions.AVERAGE:
      return '#FF9800'; // Orange
    case GradeOptions.BELOW_AVERAGE:
      return '#F44336'; // Red
    default:
      return '#757575'; // Gray
  }
};