import { protectedJson } from "@/lib/api-handler";
import { listCompanies } from "@/lib/api-service";
import type { RiskLevel } from "@/lib/types";

const RISKS = ["MAX", "HIGH", "MED", "LOW"];

export const GET = protectedJson(async (req) => {
  const q = new URL(req.url).searchParams;
  const layerRaw = q.get("layer");
  const riskRaw = q.get("risk")?.toUpperCase();
  const liquidRaw = q.get("liquid");
  const risk = riskRaw && RISKS.includes(riskRaw) ? (riskRaw as RiskLevel) : undefined;
  return listCompanies({
    layer: layerRaw ? Number(layerRaw) : undefined,
    risk,
    liquid: liquidRaw == null ? undefined : liquidRaw === "true",
    live: q.get("live") === "true",
  });
});
