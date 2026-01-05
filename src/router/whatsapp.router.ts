import { Router, Request, Response } from 'express';
import { getWhatsAppStatus, getWhatsAppClient } from '../connect/whatsapp';
import catchAsync from '../utils/catchAsync';

const router = Router();

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

export default router;
