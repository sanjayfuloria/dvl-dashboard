/**
 * Google Drive integration for DVL Dashboard
 * Uses a Service Account (no OAuth popup needed for server-side ops)
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a project → Enable Google Drive API
 * 3. Create a Service Account → Download JSON key
 * 4. Share your root Google Drive folder with the service account email
 * 5. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_DRIVE_ROOT_FOLDER_ID in .env
 */

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!

async function getAccessToken(): Promise<string> {
  // Minimal JWT-based service account token (no googleapis library needed)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }
  const payload = btoa(JSON.stringify(claims))

  // Sign with private key (requires a proper JWT library in production)
  // For production, install: npm install google-auth-library
  // and replace this with:
  //   const auth = new GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) })
  //   const client = await auth.getClient()
  //   const token = await client.getAccessToken()
  //   return token.token!

  throw new Error('Configure google-auth-library for production use. See comments in lib/google-drive.ts')
}

export async function createTeamDriveFolder(teamName: string, ventureName: string): Promise<string | null> {
  try {
    const token = await getAccessToken()
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${teamName} — ${ventureName}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [ROOT_FOLDER_ID],
      }),
    })
    const data = await res.json()
    return data.id ?? null
  } catch (err) {
    console.error('Drive folder creation failed:', err)
    return null
  }
}

export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const token = await getAccessToken()

    // Upload metadata
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
    const boundary = '-------314159265358979323846'
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      fileBuffer.toString('base64'),
      `--${boundary}--`,
    ].join('\r\n')

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
          'Content-Length': body.length.toString(),
        },
        body,
      }
    )
    return await res.json()
  } catch (err) {
    console.error('Drive upload failed:', err)
    return null
  }
}

export async function getDriveFileLink(fileId: string): Promise<string> {
  return `https://drive.google.com/file/d/${fileId}/view`
}

export async function getDriveFolderLink(folderId: string): Promise<string> {
  return `https://drive.google.com/drive/folders/${folderId}`
}
