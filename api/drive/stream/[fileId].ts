import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { allowCors } from '../../cors';

const getDriveClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { fileId } = req.query;
    if (!fileId) return res.status(400).json({ error: 'Missing fileId' });

    const drive = getDriveClient();
    const response = await drive.files.get(
      { fileId: fileId as string, alt: 'media' },
      { responseType: 'stream' }
    );
    
    res.setHeader('Content-Type', 'video/mp4');
    // @ts-ignore
    response.data.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export default allowCors(handler);
