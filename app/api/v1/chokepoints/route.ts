import { protectedJson } from "@/lib/api-handler";
import { findChokepoints } from "@/lib/api-service";

export const GET = protectedJson(() => findChokepoints());
