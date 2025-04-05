import DocumentList from "@/components/document-list";
import { auth } from "@clerk/nextjs/server";

import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Documents</h1>
      {userId}
      <DocumentList />
    </div>
  );
}
