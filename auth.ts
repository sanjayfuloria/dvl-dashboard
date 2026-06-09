// Auth is handled via custom JWT in lib/session.ts and app/api/login/route.ts
export const auth = async () => null
export const signIn = async () => {}
export const signOut = async () => {}
export const handlers = { GET: async () => new Response(''), POST: async () => new Response('') }
