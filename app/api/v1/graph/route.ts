import { protectedJson } from "@/lib/api-handler";
import { getGraph } from "@/lib/api-service";

export const GET = protectedJson(() => getGraph());
