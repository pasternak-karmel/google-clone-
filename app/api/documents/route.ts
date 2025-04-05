import { createDocument, getUserDocuments } from "@/lib/documents";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title } = await request.json();

  if (!title) {
    return new NextResponse(JSON.stringify({ error: "Title is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const document = await createDocument({
    title,
    userId: userId,
    content: "",
    collaborators: [],
  });

  return NextResponse.json(document);
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const documents = await getUserDocuments(userId);

  return NextResponse.json(documents);
}
