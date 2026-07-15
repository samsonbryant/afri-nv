"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUploadKnowledgeDocument } from "@/features/knowledge/hooks/use-knowledge";

const ACCEPTED =
  ".pdf,.docx,.doc,.ppt,.pptx,.xls,.xlsx,.csv,image/png,image/jpeg,image/webp,image/gif";

type UploadDropzoneProps = {
  className?: string;
};

export function UploadDropzone({ className }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadKnowledgeDocument();
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      Array.from(files).forEach((file) => upload.mutate(file));
    },
    [upload],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "border-border bg-muted/20 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
        dragging && "border-primary bg-primary/5",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPTED}
        multiple
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="bg-primary/10 text-primary mb-3 flex h-11 w-11 items-center justify-center rounded-full">
        {upload.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-5 w-5" aria-hidden />
        )}
      </div>
      <p className="text-foreground text-sm font-medium">Drop files here or click to upload</p>
      <p className="text-muted-foreground mt-1 text-xs">PDF, DOCX, PPT, Excel, CSV, and images</p>
    </div>
  );
}
