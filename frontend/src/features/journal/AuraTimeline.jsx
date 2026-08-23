import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { weekLabel } from "@/features/journal/date";

export function AuraTimeline() {
  const { data: history = [] } = useQuery({
    queryKey: ["aura-history"],
    queryFn: () => api.get("/me/aura/history").then((response) => response.data),
  });

  if (history.length === 0) return null;

  return (
    <div className="aura-timeline" data-testid="aura-timeline">
      <span className="eyebrow">Perjalanan auramu dari minggu ke minggu</span>
      <div className="aura-track">
        {[...history].reverse().map((item) => (
          <div className="aura-point" key={item.week_key} data-testid={`aura-point-${item.week_key}`}>
            <span
              className="aura-dot"
              style={{ background: `conic-gradient(from 40deg, ${[...item.colors, item.colors[0]].join(", ")})` }}
            />
            <time>{weekLabel(item.week_key)}</time>
            <strong>{item.name}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
