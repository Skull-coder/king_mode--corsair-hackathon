import { auth } from "@clerk/nextjs/server"
import { handleMcpRequest } from "@/lib/mcp"

export const runtime = "nodejs"
export const maxDuration = 60

async function withAuth(request: Request) {
  const {userId} = await auth() 
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  return handleMcpRequest(request, userId)
}

export async function GET(request: Request) {
  return withAuth(request)
}

export async function POST(request: Request) {
  return withAuth(request)
}

export async function DELETE(request: Request) {
  return withAuth(request)
}