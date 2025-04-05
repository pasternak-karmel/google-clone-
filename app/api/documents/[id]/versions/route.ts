import {
  getDocumentById,
  getDocumentVersions,
  revertToVersion,
} from "@/lib/documents";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
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

  // Check if user has access to this document
  if (document.userId !== userId && !document.collaborators.includes(userId)) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const versions = await getDocumentVersions(params.id);

  return NextResponse.json(versions);
}

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

  // Check if user has access to this document
  if (document.userId !== userId && !document.collaborators.includes(userId)) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { versionId } = await request.json();

  if (!versionId) {
    return new NextResponse(
      JSON.stringify({ error: "Version ID is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const updatedDocument = await revertToVersion(params.id, versionId);

  return NextResponse.json(updatedDocument);
}
