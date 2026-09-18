import { GoogleAuth } from 'google-auth-library'

const SHEET_NAME = 'Uploads'
const HEADER = [
  'Team Code', 'Team Name', 'Course', 'Section', 'Type',
  'Deliverable', 'File Name', 'Status', 'Submitted At', 'Drive Link',
]

function getAuth() {
  return new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getAccessToken(): Promise<string> {
  const auth = getAuth()
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token!
}

function getSpreadsheetId(): string | null {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID || null
}

async function sheetsFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sheets API ${res.status}: ${text}`)
  }
  return res.json()
}

// Writes the header row if the sheet is empty. Safe to call every time —
// it's a no-op once the header already exists.
async function ensureHeader(spreadsheetId: string, token: string) {
  const existing = await sheetsFetch(
    `${spreadsheetId}/values/${SHEET_NAME}!A1:J1`,
    token
  ).catch(() => null)

  if (existing?.values?.length) return

  await sheetsFetch(
    `${spreadsheetId}/values/${SHEET_NAME}!A1:J1?valueInputOption=RAW`,
    token,
    { method: 'PUT', body: JSON.stringify({ values: [HEADER] }) }
  )
}

export interface UploadRow {
  teamCode: string
  teamName: string
  course: string
  section: string
  type: 'Team' | 'Individual'
  deliverable: string
  fileName: string
  status: string
  submittedAt: string
  driveLink: string
}

// Appends a new row, or overwrites the existing row for the same team code
// + deliverable (so re-uploads update in place instead of piling up).
// Never throws into the caller — a Sheets hiccup shouldn't block an upload.
export async function syncUploadToSheet(row: UploadRow): Promise<void> {
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) return // Sheets sync not configured yet — skip quietly

  try {
    const token = await getAccessToken()
    await ensureHeader(spreadsheetId, token)

    const existing = await sheetsFetch(`${spreadsheetId}/values/${SHEET_NAME}!A2:J`, token).catch(() => null)
    const values: string[][] = existing?.values ?? []

    const rowIndex = values.findIndex((r) => r[0] === row.teamCode && r[5] === row.deliverable)
    const values_row = [
      row.teamCode, row.teamName, row.course, row.section, row.type,
      row.deliverable, row.fileName, row.status, row.submittedAt, row.driveLink,
    ]

    if (rowIndex >= 0) {
      const sheetRow = rowIndex + 2 // +1 for header, +1 for 1-indexing
      await sheetsFetch(
        `${spreadsheetId}/values/${SHEET_NAME}!A${sheetRow}:J${sheetRow}?valueInputOption=RAW`,
        token,
        { method: 'PUT', body: JSON.stringify({ values: [values_row] }) }
      )
    } else {
      await sheetsFetch(
        `${spreadsheetId}/values/${SHEET_NAME}!A2:J2:append?valueInputOption=RAW`,
        token,
        { method: 'POST', body: JSON.stringify({ values: [values_row] }) }
      )
    }
  } catch (err) {
    console.error('Google Sheets sync failed:', err)
  }
}

export function getSheetUrl(): string | null {
  const id = getSpreadsheetId()
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null
}
