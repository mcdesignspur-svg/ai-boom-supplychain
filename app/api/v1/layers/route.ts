import { protectedJson } from "@/lib/api-handler";
import { listLayers } from "@/lib/api-service";

export const GET = protectedJson(() => listLayers());
