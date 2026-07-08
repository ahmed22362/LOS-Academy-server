import { Router, Request, Response } from 'express';
import { getWhatsAppStatus, getWhatsAppClient } from '../connect/whatsapp';
import catchAsync from '../utils/catchAsync';

const router = Router();

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

export default router;
