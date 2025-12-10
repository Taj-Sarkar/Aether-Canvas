import { NextResponse } from "next/server";
import { verifySessionToken, getDefaultUser } from "@/lib/auth";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.split(";").find(c => c.trim().startsWith("session_token="))?.split("=")[1];
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  return NextResponse.json({ authenticated: true, user: getDefaultUser() });
}

