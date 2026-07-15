"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Mic, MicOff, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSendMessage, useUploadAssistantFile } from "@/features/assistant/hooks/use-assistant";
import { useAssistantStore } from "@/features/assistant/stores/assistant-store";
import type { UploadResult } from "@/features/assistant/types";
import { toast } from "sonner";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function MessageInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const draft = useAssistantStore((state) => state.draft);
  const setDraft = useAssistantStore((state) => state.setDraft);
  const activeConversationId = useAssistantStore((state) => state.activeConversationId);
  const addPendingAttachmentId = useAssistantStore((state) => state.addPendingAttachmentId);

  const send = useSendMessage();
  const upload = useUploadAssistantFile();

  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [previews, setPreviews] = useState<UploadResult[]>([]);

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognition()));
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleVoice() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      toast.message("Speech recognition is not supported in this browser");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setDraft(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("Could not capture speech");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const uploaded = await upload.mutateAsync(file);
      addPendingAttachmentId(uploaded.id);
      setPreviews((prev) => [...prev, uploaded]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content && previews.length === 0) return;

    send.mutate(
      {
        conversationId: activeConversationId,
        content: content || "(attachment)",
        attachments: previews.map((preview) => ({
          url: preview.url,
          name: preview.name,
          mimeType: preview.mimeType,
          size: preview.size,
        })),
      },
      {
        onSuccess: () => setPreviews([]),
      },
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit(event);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-background/95 border-t p-3 backdrop-blur md:p-4"
      aria-label="Send a message"
    >
      {previews.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {previews.map((preview) =>
            preview.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={preview.id}
                src={preview.url}
                alt={preview.name}
                className="border-border h-16 w-16 rounded-md border object-cover"
              />
            ) : (
              <div key={preview.id} className="border-border rounded-md border px-2 py-1 text-xs">
                {preview.name}
              </div>
            ),
          )}
        </div>
      ) : null}

      <div className="border-border bg-card focus-within:ring-ring rounded-xl border focus-within:ring-2">
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Novixa anything…"
          className="min-h-[72px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          aria-label="Message"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept="image/*,.pdf,.txt,.md,.csv,.json"
              multiple
              onChange={(event) => void onFilesSelected(event.target.files)}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Attach file"
              disabled={upload.isPending || send.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Attach image"
              disabled={upload.isPending || send.isPending}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                  window.setTimeout(() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*,.pdf,.txt,.md,.csv,.json";
                    }
                  }, 0);
                }
              }}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            {speechSupported ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={listening ? "Stop listening" : "Speak message"}
                aria-pressed={listening}
                onClick={toggleVoice}
              >
                {listening ? (
                  <MicOff className="text-destructive h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            ) : null}
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={send.isPending || (!draft.trim() && previews.length === 0)}
          >
            {send.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
