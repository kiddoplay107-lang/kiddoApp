import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './cors';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ 
    message: 'API is working!',
    env: {
      hasGoogleJson: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      googleJsonLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.length || 0,
      googleJsonParseable: (() => {
        try {
          if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return false;
          JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
          return true;
        } catch (e: any) {
          return `Error: ${e.message}`;
        }
      })(),
      hasDriveRoot: !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    },
    headers: req.headers
  });
};

export default allowCors(handler);
