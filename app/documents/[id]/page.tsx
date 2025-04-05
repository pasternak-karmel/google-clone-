import CollaboratorsPanel from "@/components/collaborators-panel";
import DocumentEditor from "@/components/document-editor";
import DocumentToolbar from "@/components/document-toolbar";
import { getDocumentById } from "@/lib/documents";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function DocumentPage(segmentData: { params: Params }) {
  const { userId } = await auth();

  const params = await segmentData.params;

  if (!userId) {
    redirect("/sign-in");
  }

  const document = await getDocumentById(params.id);

  if (!document) {
    redirect("/");
  }

  if (document.userId !== userId && !document.collaborators.includes(userId)) {
    redirect("/");
  }

  return (
    <div className="flex flex-col h-screen">
      <DocumentToolbar document={document} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm my-8 min-h-[1100px]">
            <DocumentEditor documentId={params.id} />
          </div>
        </div>
        <CollaboratorsPanel documentId={params.id} />
      </div>
    </div>
  );
}
