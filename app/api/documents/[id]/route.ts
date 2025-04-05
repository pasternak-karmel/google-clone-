import {
  deleteDocument,
  getDocumentById,
  updateDocument,
} from "@/lib/documents";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const params = await segmentData.params;

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

  return NextResponse.json(document);
}

export async function PUT(request: Request, segmentData: { params: Params }) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const params = await segmentData.params;

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

  const body = await request.json();

  const updatedDocument = await updateDocument(params.id, body);

  return NextResponse.json(updatedDocument);
}

export async function DELETE(
  request: Request,
  segmentData: { params: Params }
) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const params = await segmentData.params;

  const document = await getDocumentById(params.id);

  if (!document) {
    return new NextResponse(JSON.stringify({ error: "Document not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only the owner can delete a document
  if (document.userId !== userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await deleteDocument(params.id);

  return new NextResponse(null, { status: 204 });
}
