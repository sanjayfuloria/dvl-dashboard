import { OAuth2Client } from 'google-auth-library'

// Files and Sheet rows are created under sanjay.fuloria@ibsindia.org's own
// Drive quota via this OAuth-authorized client, not the DVL service
// account — service accounts have no storage quota of their own and every
// upload through them is rejected by Google (storageQuotaExceeded).
let cachedClient: OAuth2Client | null = null

function getOAuthClient(): OAuth2Client {
  if (cachedClient) return cachedClient
  cachedClient = new OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  )
  cachedClient.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN })
  return cachedClient
}

export async function getGoogleAccessToken(): Promise<string> {
  const client = getOAuthClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Failed to obtain Google OAuth access token')
  return token
}
