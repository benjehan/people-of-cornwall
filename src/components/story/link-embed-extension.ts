import { Node, mergeAttributes } from "@tiptap/core";

export interface LinkEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkEmbed: {
      setLinkEmbed: (options: {
        url: string;
        title: string;
        description?: string;
        image?: string;
        siteName: string;
        favicon?: string;
      }) => ReturnType;
    };
  }
}

export const LinkEmbed = Node.create<LinkEmbedOptions>({
  name: "linkEmbed",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      title: {
        default: "",
      },
      description: {
        default: null,
      },
      image: {
        default: null,
      },
      siteName: {
        default: "",
      },
      favicon: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class="link-embed"]',
        getAttrs: (element) => {
          const div = element as HTMLElement;
          return {
            url: div.dataset.url,
            title: div.dataset.title || div.querySelector(".link-embed-title")?.textContent || "",
            description: div.dataset.description || div.querySelector(".link-embed-description")?.textContent || null,
            image: div.dataset.image || div.querySelector(".link-embed-image img")?.getAttribute("src") || null,
            siteName: div.dataset.siteName || div.querySelector(".link-embed-site span")?.textContent || "",
            favicon: div.dataset.favicon || div.querySelector(".link-embed-favicon")?.getAttribute("src") || null,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { url, title, description, image, siteName, favicon } = node.attrs;

    // Build the inner content array
    const innerContent: any[] = [];

    // Image section
    if (image) {
      innerContent.push([
        "div",
        { class: "link-embed-image" },
        ["img", { src: image, alt: title || "" }],
      ]);
    }

    // Site info
    const siteContent: any[] = [];
    if (favicon) {
      siteContent.push(["img", { src: favicon, alt: "", class: "link-embed-favicon" }]);
    }
    siteContent.push(["span", {}, siteName || new URL(url).hostname]);

    // Content section
    const contentSection: any[] = [
      ["div", { class: "link-embed-site" }, ...siteContent],
      ["div", { class: "link-embed-title" }, title],
    ];

    if (description) {
      contentSection.push(["div", { class: "link-embed-description" }, description]);
    }

    innerContent.push(["div", { class: "link-embed-content" }, ...contentSection]);

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "link-embed",
        "data-url": url,
        "data-title": title,
        "data-description": description || "",
        "data-image": image || "",
        "data-site-name": siteName,
        "data-favicon": favicon || "",
        contenteditable: "false",
      }),
      [
        "a",
        {
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
          class: "link-embed-card",
        },
        ...innerContent,
      ],
    ];
  },

  addCommands() {
    return {
      setLinkEmbed:
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
