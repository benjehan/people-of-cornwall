import { Node, mergeAttributes } from "@tiptap/core";

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; platform: string; videoId: string }) => ReturnType;
    };
  }
}

export const VideoEmbed = Node.create<VideoOptions>({
  name: "videoEmbed",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      platform: {
        default: "youtube",
      },
      videoId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class="video-embed"]',
        getAttrs: (element) => {
          const div = element as HTMLElement;
          const iframe = div.querySelector("iframe");
          return {
            platform: div.dataset.platform || "youtube",
            videoId: div.dataset.videoId,
            src: iframe?.getAttribute("src"),
          };
        },
      },
      {
        tag: "iframe",
        getAttrs: (element) => {
          const iframe = element as HTMLIFrameElement;
          const src = iframe.getAttribute("src") || "";
          
          // Detect platform from src
          let platform = "youtube";
          let videoId = "";
          
          if (src.includes("youtube.com") || src.includes("youtu.be")) {
            platform = "youtube";
            const match = src.match(/embed\/([a-zA-Z0-9_-]+)/);
            videoId = match ? match[1] : "";
          } else if (src.includes("vimeo.com")) {
            platform = "vimeo";
            const match = src.match(/video\/(\d+)/);
            videoId = match ? match[1] : "";
          }
          
          return { src, platform, videoId };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { platform, videoId } = node.attrs;
    
    let iframeSrc = "";
    if (platform === "youtube") {
      iframeSrc = `https://www.youtube.com/embed/${videoId}`;
    } else if (platform === "vimeo") {
      iframeSrc = `https://player.vimeo.com/video/${videoId}`;
    }

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "video-embed",
        "data-platform": platform,
        "data-video-id": videoId,
      }),
      [
        "iframe",
        {
          src: iframeSrc,
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
