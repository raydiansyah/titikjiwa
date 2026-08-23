const MOODS = [
  ["Tenang", "#4a6b5d"],
  ["Berharap", "#c98a66"],
  ["Bingung", "#c2a686"],
  ["Berat", "#8a6d5c"],
  ["Netral", "#d8d2c8"],
];

function buildWeeks(journals) {
  const weeks = [];
  const now = new Date();

  for (let i = 3; i >= 0; i -= 1) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);

    const start = new Date(now);
    start.setDate(now.getDate() - (i + 1) * 7);

    const entries = journals.filter((journal) => {
      const createdAt = new Date(journal.created_at);
      return createdAt >= start && createdAt < end;
    });

    weeks.push({
      label: i === 0 ? "Minggu ini" : `${i} minggu lalu`,
      entries,
    });
  }

  return weeks;
}

export function MoodRecap({ journals }) {
  const weeks = buildWeeks(journals);

  return (
    <div className="mood-recap" data-testid="mood-recap">
      <div className="mood-recap-head">
        <span className="eyebrow">Rekap suasana hati</span>
        <h2>Polamu dari minggu ke minggu.</h2>
      </div>

      <div className="mood-recap-rows">
        {weeks.map((week) => {
          const total = week.entries.length;

          return (
            <div className="mood-recap-row" key={week.label}>
              <span className="mood-week">{week.label}</span>
              <div className="mood-bar">
                {total === 0 ? (
                  <span className="mood-empty">Belum ada tulisan</span>
                ) : (
                  MOODS.map(([mood, color]) => {
                    const count = week.entries.filter((journal) => journal.mood === mood).length;
                    if (count === 0) return null;

                    return (
                      <span
                        key={mood}
                        className="mood-segment"
                        style={{ width: `${(count / total) * 100}%`, background: color }}
                        title={`${mood}: ${count}`}
                      />
                    );
                  })
                )}
              </div>
              <span className="mood-total">{total} tulisan</span>
            </div>
          );
        })}
      </div>

      <div className="mood-legend">
        {MOODS.map(([mood, color]) => (
          <span key={mood}>
            <i style={{ background: color }} />
            {mood}
          </span>
        ))}
      </div>
    </div>
  );
}
