import PDFDocument from 'pdfkit';
import path from 'path';
import { GradeOptions, ReportsCourses } from '../db/models/report.model';
import logger from './logger';

const ARABIC_TEXT = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
const FONT_DIR = path.join(__dirname, '../assets/fonts');

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

const prepareText = (
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
): { text: string; align: 'left' | 'right'; wordSpacing?: number } => {
  if (!ARABIC_TEXT.test(text)) return { text, align: 'left' };

  const wrapped = text.split('\n').map((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';

    const lines: string[] = [];
    let line = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${line} ${word}`;
      if (doc.widthOfString(candidate) + candidate.split(/\s+/).length - 1 <= width) {
        line = candidate;
      }
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);

    // PDFKit shapes Arabic words correctly but lays the words out left-to-right.
    return lines
      .map((value) => value.split(/\s+/).reverse().join(' '))
      .join('\n');
  });

  return { text: wrapped.join('\n'), align: 'right', wordSpacing: 1 };
};

export const generateReportPDF = async (report: ReportData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      doc
        .registerFont('Report', path.join(FONT_DIR, 'DejaVuSans.ttf'))
        .registerFont('Report-Bold', path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'))
        .font('Report');

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
        doc.font('Report').fontSize(18);
        const title = prepareText(doc, report.title, doc.page.width - 100);
        doc
          .fillColor(darkGray)
          .text(title.text, 50, doc.y, {
            width: doc.page.width - 100,
            align: title.align === 'right' ? 'right' : 'center',
            wordSpacing: title.wordSpacing,
          })
          .moveDown(1.5);
      }

      // Student & Teacher Info Card
      const cardY = doc.y;
      const cardHeight = 80;
      
      // Card background
      doc
        .roundedRect(50, cardY, doc.page.width - 100, cardHeight, 5)
        .fill(lightGray);

      doc.font('Report').fontSize(10);
      const studentName = prepareText(
        doc,
        `Name: ${report.user?.name || 'N/A'}`,
        235,
      );
      doc
        .fontSize(12)
        .fillColor(darkGray)
        .font('Report-Bold')
        .text('Student Information', 70, cardY + 15)
        .font('Report')
        .fontSize(10)
        .text(studentName.text, 70, cardY + 35, {
          width: 235,
          align: studentName.align,
          wordSpacing: studentName.wordSpacing,
        })
        .text(`Email: ${report.user?.email || 'N/A'}`, 70, cardY + 50);

      if (report.teacher?.name) {
        const teacherName = prepareText(doc, report.teacher.name, 180);
        doc
          .fontSize(12)
          .font('Report-Bold')
          .text('Teacher', doc.page.width - 250, cardY + 15)
          .font('Report')
          .fontSize(10)
          .text(teacherName.text, doc.page.width - 250, cardY + 35, {
            width: 180,
            align: teacherName.align,
            wordSpacing: teacherName.wordSpacing,
          });
      }

      doc.y = cardY + cardHeight + 20;

      // Overall Grade Section with Badge
      doc
        .fontSize(14)
        .fillColor(darkGray)
        .font('Report-Bold')
        .text('Overall Grade', 50, doc.y, {
          width: doc.page.width - 100,
          align: 'center',
        })
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
        .font('Report-Bold')
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
          .font('Report-Bold')
          .text('Course Performance', 50)
          .moveDown(1);

        // Table setup
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = {
          no: 30,
          course: 190,
          grade: 100,
          comment: 175,
        };

        const drawTableHeader = (y: number) => {
          doc.rect(tableLeft, y, doc.page.width - 100, 30).fill(darkGray);
          doc
            .fontSize(10)
            .fillColor('#FFF')
            .font('Report-Bold')
            .text('#', tableLeft + 5, y + 10, { width: colWidths.no - 10 })
            .text('Course Name', tableLeft + colWidths.no + 5, y + 10, {
              width: colWidths.course - 10,
            })
            .text('Grade', tableLeft + colWidths.no + colWidths.course + 5, y + 10, {
              width: colWidths.grade - 10,
            })
            .text(
              'Comment',
              tableLeft + colWidths.no + colWidths.course + colWidths.grade + 5,
              y + 10,
              { width: colWidths.comment - 10 },
            );
        };

        drawTableHeader(tableTop);

        // Table rows
        let currentY = tableTop + 30;

        report.reportCourses.forEach((course, index) => {
          const isEven = index % 2 === 0;
          const courseGradeColor = getGradeColor(course.courseGrade);
          const courseWidth = colWidths.course - 10;
          const commentWidth = colWidths.comment - 10;

          doc.font('Report').fontSize(8);
          const courseName = prepareText(doc, course.courseName, courseWidth);
          const courseComment = prepareText(
            doc,
            course.courseComment || '-',
            commentWidth,
          );
          const rowHeight = Math.max(
            35,
            doc.heightOfString(courseName.text, {
              width: courseWidth,
              align: courseName.align,
              wordSpacing: courseName.wordSpacing,
            }) + 20,
            doc.heightOfString(courseComment.text, {
              width: commentWidth,
              align: courseComment.align,
              wordSpacing: courseComment.wordSpacing,
            }) + 20,
          );

          // ponytail: one row must fit on a page; split it only if comments become essay-length.
          if (currentY + rowHeight > doc.page.height - 120) {
            doc.addPage();
            drawTableHeader(50);
            currentY = 80;
          }

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
            .font('Report')
            .text(`${index + 1}`, tableLeft + 5, currentY + 10, { width: colWidths.no })
            .text(courseName.text, tableLeft + colWidths.no + 5, currentY + 10, {
              width: courseWidth,
              align: courseName.align,
              wordSpacing: courseName.wordSpacing,
            });

          // Grade badge in table
          const gradeBadgeX = tableLeft + colWidths.no + colWidths.course + 15;
          const gradeBadgeY = currentY + (rowHeight - 20) / 2;
          doc
            .roundedRect(gradeBadgeX, gradeBadgeY, 70, 20, 10)
            .fill(courseGradeColor);

          doc
            .fontSize(8)
            .fillColor('#FFF')
            .font('Report-Bold')
            .text(course.courseGrade.toUpperCase(), gradeBadgeX, gradeBadgeY + 5, {
              width: 70,
              align: 'center',
            });

          doc
            .fontSize(8)
            .fillColor(darkGray)
            .font('Report')
            .text(
              courseComment.text,
              tableLeft + colWidths.no + colWidths.course + colWidths.grade + 5,
              currentY + 10,
              {
                width: commentWidth,
                align: courseComment.align,
                wordSpacing: courseComment.wordSpacing,
              },
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

        const commentWidth = doc.page.width - 140;
        doc.font('Report').fontSize(10);
        const comment = prepareText(doc, report.comment, commentWidth);
        const cardHeight = Math.max(
          100,
          doc.heightOfString(comment.text, {
            width: commentWidth,
            align: comment.align,
            wordSpacing: comment.wordSpacing,
            lineGap: 3,
          }) + 55,
        );
        if (doc.y + cardHeight > doc.page.height - 110) {
          doc.addPage();
          doc.y = 50;
        }
        const commentY = doc.y;
        doc
          .roundedRect(50, commentY, doc.page.width - 100, cardHeight, 5)
          .fill(lightGray);

        doc
          .fontSize(12)
          .fillColor(darkGray)
          .font('Report-Bold')
          .text('Teacher Comments', 70, commentY + 15)
          .font('Report')
          .fontSize(10)
          .text(comment.text, 70, commentY + 35, {
            width: commentWidth,
            align: comment.align,
            wordSpacing: comment.wordSpacing,
            lineGap: 3,
          });

        doc.y = commentY + cardHeight + 20;
      }

      // Footer
      const footerY = doc.page.height - 100;
      doc
        .fontSize(8)
        .fillColor('#999')
        .font('Report')
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
