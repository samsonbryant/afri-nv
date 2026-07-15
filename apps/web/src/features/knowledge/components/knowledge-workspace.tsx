"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentDetailDrawer } from "@/features/knowledge/components/document-detail-drawer";
import { DocumentLibrary } from "@/features/knowledge/components/document-library";
import { KnowledgeChatPanel } from "@/features/knowledge/components/knowledge-chat-panel";
import { UploadDropzone } from "@/features/knowledge/components/upload-dropzone";

export function KnowledgeWorkspace() {
  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Upload documents, inspect chunks, and chat with your workspace knowledge."
      />

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <UploadDropzone />
          <DocumentLibrary />
        </TabsContent>

        <TabsContent value="chat">
          <KnowledgeChatPanel />
        </TabsContent>
      </Tabs>

      <DocumentDetailDrawer />
    </div>
  );
}
