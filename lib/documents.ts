"use server";

import { v4 as uuidv4 } from "uuid";
import { getUserById } from "./users";

let documents = [
  {
    id: "1",
    title: "Welcome to DocCollab",
    content:
      '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Welcome to DocCollab!","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
    userId: "user_2vKB0FGwH274NRljUEhcNGWwCOY",
    collaborators: [
      "user_2vKB0FGwH274NRljUEhcNGWwCOY",
      "user_2vKJBu57AYm4l7ja2rcxO3YYTUW",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let versions = [
  {
    id: "1",
    documentId: "1",
    content:
      '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Welcome to DocCollab!","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
    userId: "user_2vKJBu57AYm4l7ja2rcxO3YYTUW",
    userName: "Admin",
    createdAt: new Date().toISOString(),
  },
];

export async function getDocumentById(id: string) {
  return documents.find((doc) => doc.id === id) || null;
}

export async function getUserDocuments(userId: string) {
  return documents.filter(
    (doc) => doc.userId === userId || doc.collaborators.includes(userId)
  );
}

export async function createDocument(data: {
  title: string;
  userId: string;
  content: string;
  collaborators: string[];
}) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const newDocument = {
    id,
    title: data.title,
    content: data.content,
    userId: data.userId,
    collaborators: data.collaborators,
    createdAt: now,
    updatedAt: now,
  };

  documents.push(newDocument);

  // Create initial version
  const versionId = uuidv4();
  const user = await getUserById(data.userId);

  versions.push({
    id: versionId,
    documentId: id,
    content: data.content,
    userId: data.userId,
    userName: user?.name || "Unknown",
    createdAt: now,
  });

  return newDocument;
}

export async function updateDocument(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    collaborators: string[];
  }>
) {
  const index = documents.findIndex((doc) => doc.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDocument = {
    ...documents[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  documents[index] = updatedDocument;

  // Create a new version if content was updated
  if (data.content) {
    const versionId = uuidv4();
    const user = await getUserById(documents[index].userId);

    versions.push({
      id: versionId,
      documentId: id,
      content: data.content,
      userId: documents[index].userId,
      userName: user?.name || "Unknown",
      createdAt: new Date().toISOString(),
    });
  }

  return updatedDocument;
}

export async function deleteDocument(id: string) {
  documents = documents.filter((doc) => doc.id !== id);
  versions = versions.filter((version) => version.documentId !== id);
  return true;
}

export async function shareDocument(id: string, userId: string) {
  const index = documents.findIndex((doc) => doc.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDocument = {
    ...documents[index],
    collaborators: [...documents[index].collaborators, userId],
    updatedAt: new Date().toISOString(),
  };

  documents[index] = updatedDocument;

  return updatedDocument;
}

export async function getDocumentVersions(id: string) {
  return versions
    .filter((version) => version.documentId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function revertToVersion(documentId: string, versionId: string) {
  const version = versions.find((v) => v.id === versionId);

  if (!version) {
    return null;
  }

  return updateDocument(documentId, { content: version.content });
}
