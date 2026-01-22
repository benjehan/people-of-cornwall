"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Undo, Redo, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ImageUploadDialog } from "./image-upload-dialog";

interface StoryEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  storyId?: string;
}

export function StoryEditor({
  content,
  onChange,
  placeholder = "Start writing your story...",
  storyId,
}: StoryEditorProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
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

  if (!editor) {
    return (
      <div className="min-h-[400px] animate-pulse rounded-lg bg-chalk-white-dark/50" />
    );
  }

  return (
    <div className="rounded-lg border border-chalk-white-dark bg-chalk-white">
      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onUpload={handleImageInsert}
        storyId={storyId}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-chalk-white-dark p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-chalk-white-dark"
          )}
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
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-6 w-px bg-chalk-white-dark" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-chalk-white-dark"
          )}
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
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-6 w-px bg-chalk-white-dark" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setImageDialogOpen(true)}
          className="h-8 px-2 gap-1"
        >
          <ImagePlus className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Image</span>
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
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
      `}</style>
    </div>
  );
}
