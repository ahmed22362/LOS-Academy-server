import { Router, Request, Response } from 'express';
import {
  getWhatsAppStatus,
  getWhatsAppClient,
  listWhatsAppTemplates,
  getWhatsAppTemplate,
  getSessionReportTemplateConfig,
  sendSessionReportReadyTemplate,
  getWhatsAppConfigStatus,
} from '../connect/whatsapp';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import { generateReportPDF } from '../utils/generateReportPDF';
import { GradeOptions } from '../db/models/report.model';

const router = Router();

const sendSessionReportReadyTest = catchAsync(
  async (req: Request, res: Response, next) => {
    const {
      phoneNumber,
      studentName = 'Ahmed',
      sessionName = 'Quran session',
      sessionDate = new Intl.DateTimeFormat('en-US', {
        timeZone: process.env.WHATSAPP_REPORT_TIME_ZONE || 'America/New_York',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
      templateName,
      templateLanguage,
      countryCode,
    } = req.body;

    if (!phoneNumber) {
      return next(new AppError(400, 'phoneNumber is required'));
    }

    const pdfBuffer = await generateReportPDF({
      id: Date.now(),
      title: sessionName,
      grade: GradeOptions.EXCELLENT,
      comment: 'This is a test session report sent from LOS Academy server.',
      reportCourses: [
        {
          courseName: 'Quran Recitation',
          courseGrade: GradeOptions.EXCELLENT,
          courseComment: 'Clear test report generated successfully.' as any,
        },
      ],
      createdAt: new Date(),
      user: {
        name: studentName,
        email: 'test@example.com',
      },
      teacher: {
        name: 'LOS Academy',
      },
    });

    const success = await sendSessionReportReadyTemplate({
      phoneNumber,
      pdfBuffer,
      fileName: 'Session_Report_Test.pdf',
      studentName,
      sessionName,
      sessionDate,
      templateName,
      templateLanguage,
      countryCode,
    });

    if (!success) {
      return next(new AppError(502, 'Failed to send WhatsApp test template'));
    }

    res.status(200).json({
      status: 'success',
      message: 'WhatsApp test template sent successfully',
      data: {
        phoneNumber,
        studentName,
        sessionName,
        sessionDate,
        countryCode: countryCode || process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '20',
      },
    });
  },
);

router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post('/webhook', (req: Request, res: Response) => {
  console.log('WhatsApp webhook:', JSON.stringify(req.body));
  return res.sendStatus(200);
});

// GET WhatsApp status
router.get(
  '/status',
  catchAsync(async (req: Request, res: Response) => {
    const isReady = getWhatsAppStatus();
    const client = getWhatsAppClient();

    res.status(200).json({
      status: 'success',
      data: {
        connected: isReady,
        clientInitialized: client !== null,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

// GET WhatsApp Cloud API config status without exposing secrets
router.get(
  '/templates/setup',
  catchAsync(async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      data: getWhatsAppConfigStatus(),
    });
  })
);

// GET WhatsApp message templates
router.get(
  '/templates',
  catchAsync(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const templates = await listWhatsAppTemplates({
      limit,
      after: req.query.after as string | undefined,
      before: req.query.before as string | undefined,
      name: req.query.name as string | undefined,
      status: req.query.status as string | undefined,
    });

    res.status(200).json({
      status: 'success',
      data: templates,
    });
  })
);

// Shortcut for sending a session report template test
router.post('/templates', sendSessionReportReadyTest);

// GET configured session report template
router.get(
  '/templates/session-report-ready',
  catchAsync(async (req: Request, res: Response, next) => {
    const config = getSessionReportTemplateConfig();
    const template = await getWhatsAppTemplate({
      name: config.name,
      language: (req.query.language as string | undefined) || config.language,
    });

    if (!template) {
      return next(
        new AppError(
          404,
          `Template ${config.name} was not found for language ${config.language}`,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        configuredTemplate: config,
        template,
      },
    });
  })
);

// Send a test message using configured session report template
router.post(
  '/templates/session-report-ready/test',
  sendSessionReportReadyTest
);

// GET one WhatsApp message template by name
router.get(
  '/templates/:name',
  catchAsync(async (req: Request, res: Response, next) => {
    const template = await getWhatsAppTemplate({
      name: req.params.name,
      language: req.query.language as string | undefined,
    });

    if (!template) {
      return next(new AppError(404, `Template ${req.params.name} was not found`));
    }

    res.status(200).json({
      status: 'success',
      data: template,
    });
  })
);

export default router;
