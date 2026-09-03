import { GoogleAuth } from 'google-auth-library'

function getAuth() {
  return new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

async function getAccessToken(): Promise<string> {
  const auth = getAuth()
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token!
}

export async function createTeamDriveFolder(teamName: string, ventureName: string, course?: string): Promise<string | null> {
  try {
    const token = await getAccessToken()
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!

    // Folder name carries the course tag (e.g. "[MDT]") so faculty browsing
    // Drive directly — without the dashboard — can tell at a glance which
    // course a team's submissions belong to. This matters because a
    // student can run two separate teams under the same or similar name
    // across MDT and MPB.
    const courseTag = course ? ` [${course}]` : ''

    // Create main team folder
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${teamName}${courseTag} — ${ventureName || teamName}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
      }),
    })
    const folder = await res.json()
    if (!folder.id) return null

    // Create subfolders
    const subfolders = ['Deliverables', 'Meeting Notes', 'Prototypes', 'Research', 'Presentations']
    for (const name of subfolders) {
      await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folder.id],
        }),
      })
    }

    return folder.id
  } catch (err) {
    console.error('Drive folder creation failed:', err)
    return null
  }
}

export async function getOrCreateSubfolder(parentFolderId: string, name: string): Promise<string | null> {
  try {
    const token = await getAccessToken()
    // Check if subfolder exists
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${name}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const searchData = await searchRes.json()
    if (searchData.files?.length > 0) return searchData.files[0].id

    // Create if not exists
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      }),
    })
    const folder = await res.json()
    return folder.id ?? null
  } catch (err) {
    console.error('Subfolder creation failed:', err)
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
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
    const boundary = 'dvl_boundary_314159'
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      'Content-Transfer-Encoding: base64',
      '',
      fileBuffer.toString('base64'),
      `--${boundary}--`,
    ].join('\r\n')

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
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

export function getDriveFolderLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`
}

export function getDriveFileLink(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}
