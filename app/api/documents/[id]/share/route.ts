import { getDocumentById, shareDocument } from "@/lib/documents";
import { getUserByEmail } from "@/lib/users";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const document = await getDocumentById(params.id);

  if (!document) {
    return new NextResponse(JSON.stringify({ error: "Document not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only the owner can share a document
  if (document.userId !== userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email } = await request.json();

  if (!email) {
    return new NextResponse(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (document.collaborators.includes(user.id)) {
    return NextResponse.json(document);
  }

  const updatedDocument = await shareDocument(params.id, user.id);

  return NextResponse.json(updatedDocument);
}
