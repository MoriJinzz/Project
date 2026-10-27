export type IdeaInput = {
  title: string;
  description: string;
  author_nickname: string;
};

export function parseIdeaInput(value: unknown): IdeaInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.title !== "string" ||
    typeof input.description !== "string" ||
    typeof input.author_nickname !== "string"
  ) return null;

  const title = input.title.trim();
  const description = input.description.trim();
  const author_nickname = input.author_nickname.trim();

  if (
    title.length < 3 || title.length > 120 ||
    description.length < 10 || description.length > 1000 ||
    author_nickname.length < 2 || author_nickname.length > 40
  ) return null;

  return { title, description, author_nickname };
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
