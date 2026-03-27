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
    const { folderId } = req.query;
    if (!folderId) return res.status(400).json({ error: 'Missing folderId' });

    const drive = getDriveClient();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
      fields: 'files(id, name, thumbnailLink)',
      orderBy: 'name',
    });
    res.status(200).json(response.data.files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export default allowCors(handler);
