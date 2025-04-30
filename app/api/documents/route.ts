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

  try {
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return new NextResponse(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Creating document with title: ${title} for user: ${userId}`);

    const document = await createDocument({
      title,
      userId: userId,
      content: "",
      collaborators: [],
    });

    console.log(`Document created successfully: ${document.id}`);

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error creating document:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create document" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const documents = await getUserDocuments(userId);
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch documents" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
