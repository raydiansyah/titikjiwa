import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { isoWeekKey, weekLabel } from "./date";

export function WeeklyInsight() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: insights = [] } = useQuery({
    queryKey: ["weekly-insights"],
    queryFn: () => api.get("/ai/weekly-insights").then((response) => response.data),
  });

  const currentKey = isoWeekKey(new Date());
  const current = insights.find((item) => item.week_key === currentKey);
  const past = insights.filter((item) => item.week_key !== currentKey);

  const generate = async () => {
    setBusy(true);
    try {
      await api.post("/ai/weekly-insight");
      await queryClient.invalidateQueries({ queryKey: ["weekly-insights"] });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="insight-card" data-testid="weekly-insight">
      {current ? (
        <>
          <span className="eyebrow">Catatan lembut minggu ini</span>
          <p data-testid="weekly-insight-text">{current.text}</p>
        </>
      ) : (
        <>
          <span className="eyebrow">Insight mingguan AI</span>
          <p className="insight-teaser">
            Biarkan Teman AI merangkum pola suasana hatimu minggu ini menjadi satu catatan lembut.
          </p>
          <button className="button button-outline" onClick={generate} disabled={busy} data-testid="generate-insight-button">
            {busy ? "Merangkum dengan hati-hati…" : "Rangkum minggu ini"}
            <Sparkles size={15} />
          </button>
        </>
      )}

      {past.length > 0 && (
        <div className="insight-timeline" data-testid="insight-timeline">
          <span className="eyebrow">Linimasa pertumbuhanmu</span>
          {past.map((item) => (
            <div className="insight-item" key={item.week_key} data-testid={`insight-${item.week_key}`}>
              <time>{weekLabel(item.week_key)}</time>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
