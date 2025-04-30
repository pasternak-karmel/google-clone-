"use server";

import { db } from "@/db";
import {
  documentCollaborators,
  documents,
  documentVersions,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getUserById } from "./users";

export async function getDocumentById(id: string) {
  const results = await db
    .select()
    .from(documents)
    .where(eq(documents.id, Number.parseInt(id)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const document = results[0];

  const collaboratorsResults = await db
    .select({
      userId: documentCollaborators.userId,
    })
    .from(documentCollaborators)
    .where(eq(documentCollaborators.documentId, Number.parseInt(id)));

  const collaborators = collaboratorsResults.map((c) => c.userId);

  return {
    ...document,
    collaborators,
  };
}

export async function getUserDocuments(userId: string) {
  const ownedDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId));

  const collaborationResults = await db
    .select({
      documentId: documentCollaborators.documentId,
    })
    .from(documentCollaborators)
    .where(eq(documentCollaborators.userId, userId));

  const collaborationIds = collaborationResults.map((c) => c.documentId);

  let collaboratedDocuments: any[] = [];
  if (collaborationIds.length > 0) {
    collaboratedDocuments = await db
      .select()
      .from(documents)
      .where(inArray(documents.id, collaborationIds));
  }

  const allDocuments = [...ownedDocuments, ...collaboratedDocuments];

  const documentsWithCollaborators = await Promise.all(
    allDocuments.map(async (doc) => {
      const collaboratorsResults = await db
        .select({
          userId: documentCollaborators.userId,
        })
        .from(documentCollaborators)
        .where(eq(documentCollaborators.documentId, doc.id));

      const collaborators = collaboratorsResults.map((c) => c.userId);

      return {
        ...doc,
        collaborators,
      };
    })
  );

  return documentsWithCollaborators;
}

function ensureValidContent(content: string | null): any {
  if (!content) {
    return {
      root: {
        children: [
          {
            children: [],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    };
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    return content;
  }
}

export async function createDocument(data: {
  title: string;
  userId: string;
  content: string;
  collaborators: string[];
}) {
  const validContent = ensureValidContent(data.content);

  const [newDocument] = await db
    .insert(documents)
    .values({
      title: data.title,
      content: validContent,
      userId: data.userId,
    })
    .returning();

  if (data.collaborators && data.collaborators.length > 0) {
    await Promise.all(
      data.collaborators.map(async (userId) => {
        await db.insert(documentCollaborators).values({
          documentId: newDocument.id,
          userId,
        });
      })
    );
  }

  const user = await getUserById(data.userId);

  if (!user) {
    throw new Error("User not found");
  }
  await db.insert(documentVersions).values({
    documentId: newDocument.id,
    content: validContent,
    userId: data.userId,
  });

  return {
    ...newDocument,
    collaborators: data.collaborators || [],
  };
}

export async function updateDocument(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    collaborators: string[];
  }>
) {
  const documentId = Number.parseInt(id);

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.content !== undefined) {
    updateData.content = ensureValidContent(data.content);
  }

  const [updatedDocument] = await db
    .update(documents)
    .set(updateData)
    .where(eq(documents.id, documentId))
    .returning();

  if (data.content) {
    await db.insert(documentVersions).values({
      documentId,
      content: ensureValidContent(data.content),
      userId: updatedDocument.userId,
    });
  }

  const collaboratorsResults = await db
    .select({
      userId: documentCollaborators.userId,
    })
    .from(documentCollaborators)
    .where(eq(documentCollaborators.documentId, documentId));

  const currentCollaborators = collaboratorsResults.map((c) => c.userId);

  return {
    ...updatedDocument,
    collaborators: currentCollaborators,
  };
}

export async function deleteDocument(id: string) {
  const documentId = Number.parseInt(id);

  await db.delete(documents).where(eq(documents.id, documentId));

  return true;
}

export async function shareDocument(id: string, userId: string) {
  const documentId = Number.parseInt(id);

  const existingCollaborator = await db
    .select()
    .from(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      )
    )
    .limit(1);

  if (existingCollaborator.length === 0) {
    await db.insert(documentCollaborators).values({
      documentId,
      userId,
    });
  }

  return getDocumentById(id);
}

export async function getDocumentVersions(id: string) {
  const documentId = Number.parseInt(id);

  const versions = await db
    .select({
      id: documentVersions.id,
      documentId: documentVersions.documentId,
      content: documentVersions.content,
      userId: documentVersions.userId,
      createdAt: documentVersions.createdAt,
    })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(documentVersions.createdAt);

  const versionsWithUserInfo = await Promise.all(
    versions.map(async (version) => {
      const user = await getUserById(version.userId);
      return {
        ...version,
        userName: user?.name || "Unknown",
      };
    })
  );

  return versionsWithUserInfo;
}

export async function revertToVersion(documentId: string, versionId: string) {
  const docId = Number.parseInt(documentId);
  const verId = Number.parseInt(versionId);

  const versionResults = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.id, verId))
    .limit(1);

  if (versionResults.length === 0) {
    return null;
  }

  const version = versionResults[0];

  return updateDocument(documentId, {
    content: JSON.stringify(version.content),
  });
}
