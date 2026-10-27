import { IdeaBoard, type Idea } from "@/app/idea-board";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  let ideas: Idea[] = [];
  let loadError = false;

  try {
    const { data, error } = await getSupabase()
      .from("idea_board")
      .select("id,title,description,author_nickname,created_at,vote_count")
      .order("created_at", { ascending: false });
    if (error) throw error;
    ideas = (data ?? []) as Idea[];
  } catch (error) {
    console.error("Could not load ideas", error);
    loadError = true;
  }

  return <IdeaBoard ideas={ideas} loadError={loadError} />;
}
