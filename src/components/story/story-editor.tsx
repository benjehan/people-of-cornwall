"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Undo, Redo, ImagePlus, Youtube, Mic, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { ImageUploadDialog } from "./image-upload-dialog";
import { VideoEmbedDialog } from "./video-embed-dialog";
import { SpeechToText } from "./speech-to-text";
import { AIEnhanceDialog } from "./ai-enhance-dialog";
import { VideoEmbed } from "./video-node-extension";

interface StoryEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  storyId?: string;
  title?: string;
}

export function StoryEditor({
  content,
  onChange,
  placeholder = "Start writing your story...",
  storyId,
  title = "",
}: StoryEditorProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [initialContent, setInitialContent] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full mx-auto my-4",
        },
      }),
      VideoEmbed.configure({
        HTMLAttributes: {
          class: "video-embed",
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "story-content prose prose-lg max-w-none focus:outline-none min-h-[400px]",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when prop changes (for loading existing stories)
  useEffect(() => {
    if (editor && content !== initialContent && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setInitialContent(content);
    }
  }, [content, editor, initialContent]);

  const handleImageInsert = (url: string, attribution?: string) => {
    if (!editor) return;

    // Insert the image
    editor.chain().focus().setImage({ src: url }).run();

    // If there's attribution, add a caption below the image
    if (attribution) {
      editor
        .chain()
        .focus()
        .insertContent(`<p><em>Photo: ${attribution}</em></p>`)
        .run();
    }
  };

  const handleVideoEmbed = (embedHtml: string, videoUrl: string) => {
    if (!editor) return;
    
    // Extract platform and video ID from the embed HTML
    const platformMatch = embedHtml.match(/data-platform="([^"]+)"/);
    const videoIdMatch = embedHtml.match(/data-video-id="([^"]+)"/);
    
    const platform = platformMatch?.[1] || "youtube";
    const videoId = videoIdMatch?.[1] || "";
    
    if (videoId) {
      // Use the custom video extension command
      editor.chain().focus().setVideo({
        src: platform === "youtube" 
          ? `https://www.youtube.com/embed/${videoId}`
          : `https://player.vimeo.com/video/${videoId}`,
        platform,
        videoId,
      }).run();
    }
  };

  const handleSpeechTranscript = useCallback((text: string) => {
    if (!editor) return;
    // Insert the transcribed text at the cursor position
    editor.chain().focus().insertContent(text).run();
  }, [editor]);

  const handleAIEnhance = (enhancedContent: string) => {
    if (!editor) return;
    // The AI dialog now returns proper HTML with media preserved
    // Just set it directly
    editor.commands.setContent(enhancedContent);
    onChange(enhancedContent);
  };

  if (!editor) {
    return (
      <div className="min-h-[400px] animate-pulse rounded-lg bg-chalk-white-dark/50" />
    );
  }

  return (
    <div className="rounded-lg border border-chalk-white-dark bg-chalk-white">
      {/* Dialogs */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onUpload={handleImageInsert}
        storyId={storyId}
      />
      <VideoEmbedDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        onEmbed={handleVideoEmbed}
      />
      <AIEnhanceDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        originalContent={content}
        title={title}
        onAccept={handleAIEnhance}
      />

      {/* Voice Input Section (collapsible) */}
      {showVoiceInput && (
        <div className="border-b border-chalk-white-dark bg-cream/50 p-4">
          <SpeechToText onTranscript={handleSpeechTranscript} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-chalk-white-dark p-2">
        {/* Text formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-chalk-white-dark"
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-chalk-white-dark"
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-6 w-px bg-chalk-white-dark" />
        
        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-chalk-white-dark"
          )}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("orderedList") && "bg-chalk-white-dark"
          )}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-6 w-px bg-chalk-white-dark" />
        
        {/* Media */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setImageDialogOpen(true)}
          className="h-8 px-2 gap-1"
          title="Add image"
        >
          <ImagePlus className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Image</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setVideoDialogOpen(true)}
          className="h-8 px-2 gap-1"
          title="Embed YouTube or Vimeo video"
        >
          <Youtube className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Video</span>
        </Button>
        <div className="mx-2 h-6 w-px bg-chalk-white-dark" />
        
        {/* Voice & AI */}
        <Button
          type="button"
          variant={showVoiceInput ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowVoiceInput(!showVoiceInput)}
          className={cn(
            "h-8 px-2 gap-1",
            showVoiceInput && "bg-granite text-parchment"
          )}
          title="Voice input - narrate your story"
        >
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Voice</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAiDialogOpen(true)}
          className="h-8 px-2 gap-1"
          title="AI writing assistant"
        >
          <Wand2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">AI Help</span>
        </Button>
        
        <div className="flex-1" />
        
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--slate-grey-lighter);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        .ProseMirror:focus {
          outline: none;
        }
        
        .ProseMirror p {
          margin-bottom: 1em;
        }
        
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 1.25em;
          margin-bottom: 0.5em;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        
        .ProseMirror li {
          margin-bottom: 0.25em;
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem auto;
          display: block;
        }
        
        .ProseMirror .video-embed {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          margin: 1.5rem 0;
          border-radius: 0.5rem;
          overflow: hidden;
          background: #1a1a1a;
        }
        
        .ProseMirror .video-embed iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
      `}</style>
    </div>
  );
}
