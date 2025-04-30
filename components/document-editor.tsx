/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $createHeadingNode } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode } from "lexical";

import { useCollaborationContext } from "@/context/collaboration-context";
import { debounce } from "@/lib/utils";
import { ImageNode } from "@/nodes/ImageNode";
import { useAuth } from "@clerk/nextjs";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import {
  $getRoot,
  // $isElementNode,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ImagePlugin from "./editor/image-plugin";
import ToolbarPlugin from "./editor/toolbar-plugin";

interface DocumentEditorProps {
  documentId: string;
}

export default function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [editorState, setEditorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { collaborativeEditing, socket, sendDocumentChange, isConnected } =
    useCollaborationContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { userId } = useAuth();
  const editorRef = useRef<LexicalEditor | null>(null);
  const isRemoteChangeRef = useRef(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch document");
        }

        const document = await response.json();
        setEditorState(document.content || null);
      } catch {
        toast.error("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, router]);

  useEffect(() => {
    if (!socket) return;

    const handleDocumentChanged = (data: {
      userId: string;
      changes: string;
    }) => {
      try {
        if (data.userId === userId) {
          return;
        }

        isRemoteChangeRef.current = true;

        const editor = editorRef.current;
        if (!editor) {
          return;
        }

        editor.update(() => {
          try {
            const parsedChanges = JSON.parse(data.changes);
            const root = $getRoot();

            root.clear();

            if (parsedChanges && parsedChanges.root) {
              const newRoot = $parseSerializedNode(parsedChanges);
              root.append(...newRoot.getChildren());
            }
          } catch (parseError) {
            console.error("Error parsing remote changes:", parseError);
          }
        });

        setTimeout(() => {
          isRemoteChangeRef.current = false;
        }, 0);
      } catch (error) {
        console.error("Error applying remote changes:", error);
      }
    };

    socket.on("document-changed", handleDocumentChanged);

    return () => {
      socket.off("document-changed", handleDocumentChanged);
    };
  }, [socket, userId]);

  const initialConfig = {
    namespace: "DocCollab",
    theme: {
      root: "p-0 h-full",
      link: "cursor-pointer text-blue-500 underline",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
        underlineStrikethrough: "underline line-through",
      },
    },
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
      ImageNode,
    ],
    editorState: editorState || undefined,
  };

  const saveContent = debounce(async (content: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to save document");
    } catch {
      toast.error("Failed to save changes");
    }
  }, 1000);

  const onChange = useCallback(
    (editorState: EditorState) => {
      if (isRemoteChangeRef.current) {
        return;
      }

      editorState.read(() => {
        try {
          const root = $getRoot();

          const serializedState = root.exportJSON();
          // const serializedState = {
          //   root: {
          //     children: root.getChildren().map((node) => {
          //       if ($isElementNode(node)) {
          //         return {
          //           children: node
          //             .getChildren()
          //             .map((child) => child.exportJSON()),
          //           direction: node.getDirection(),
          //           format: node.getFormat(),
          //           indent: node.getIndent(),
          //           type: node.getType(),
          //           version: 1,
          //         };
          //       }
          //       return node.exportJSON();
          //     }),
          //     direction: root.getDirection(),
          //     format: root.getFormat(),
          //     indent: root.getIndent(),
          //     type: "root",
          //     version: 1,
          //   },
          // };

          const content = JSON.stringify(serializedState);

          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          saveTimeoutRef.current = setTimeout(() => {
            saveContent(content);
          }, 1000);

          if (collaborativeEditing && socket && isConnected) {
            sendDocumentChange(documentId, content);
          } else {
          }
        } catch (error) {
          console.error("Error serializing editor state:", error);
        }
      });
    },
    [
      documentId,
      saveContent,
      collaborativeEditing,
      sendDocumentChange,
      socket,
      isConnected,
    ]
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading document...</div>;
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input min-h-[500px] outline-none" />
            }
            placeholder={
              <div className="editor-placeholder">Start typing...</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <ImagePlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={onChange} />

          <EditorRefPlugin editorRef={editorRef} />
        </div>
      </div>
    </LexicalComposer>
  );
}

function EditorRefPlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
}

function $parseSerializedNode(serializedNode: any) {
  const root = $getRoot();

  try {
    if (serializedNode && serializedNode.root && serializedNode.root.children) {
      const children = serializedNode.root.children;
      root.clear();

      children.forEach((child: any) => {
        if (child.type === "paragraph") {
          const paragraph = $createParagraphNode();

          if (child.children && Array.isArray(child.children)) {
            child.children.forEach((textChild: any) => {
              if (textChild.type === "text") {
                const textNode = $createTextNode(textChild.text || "");
                if (textChild.format) {
                  if (textChild.format & 1) textNode.toggleFormat("bold");
                  if (textChild.format & 2) textNode.toggleFormat("italic");
                  if (textChild.format & 4) textNode.toggleFormat("underline");
                  if (textChild.format & 8)
                    textNode.toggleFormat("strikethrough");
                  if (textChild.format & 16) textNode.toggleFormat("code");
                }
                paragraph.append(textNode);
              }
            });
          }

          root.append(paragraph);
        } else if (child.type === "heading") {
          const heading = $createHeadingNode(child.tag || "h1");

          if (child.children && Array.isArray(child.children)) {
            child.children.forEach((textChild: any) => {
              if (textChild.type === "text") {
                const textNode = $createTextNode(textChild.text || "");
                heading.append(textNode);
              }
            });
          }

          root.append(heading);
        }
      });
    }
  } catch (error) {
    console.error("Error parsing serialized node:", error);
  }

  return root;
}
