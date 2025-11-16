export type ChatAction =
  | {
      type: "copy";
      label: string;
      value: string;
    }
  | {
      type: "link";
      label: string;
      value: string;
      target?: "_blank" | "_self";
    }
  | {
      type: "post";
      label: string;
      value: string;
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    };

export interface ChatResponse {
  reply: string;
  actions: ChatAction[];
  suggestions?: string[];
}

export function createCopyAction(label: string, value: string): ChatAction {
  return { type: "copy", label, value };
}

export function createLinkAction(
  label: string,
  value: string,
  target: "_blank" | "_self" = "_blank"
): ChatAction {
  return { type: "link", label, value, target };
}

export function createPostAction(
  label: string,
  value: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST"
): ChatAction {
  return { type: "post", label, value, method };
}
