import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { allowCors } from '../../cors';

const getDriveClient = () => {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable');
  }
  try {
    const credentials = JSON.parse(json);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    return google.drive({ version: 'v3', auth });
  } catch (e: any) {
    throw new Error(`Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ${e.message}`);
  }
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
