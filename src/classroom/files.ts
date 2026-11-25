import type { GroupView } from "../domain/model";
import type { ReceivedFeedback } from "../domain/feedback";
import { feedbackLabel, FEEDBACK_SCREENS } from "../domain/feedback";
import { content } from "../content";
export function download(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], {
      type: filename.endsWith(".csv")
        ? "text/csv;charset=utf-8"
        : "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvText(rows: unknown[][]) {
  const cell = (value: unknown) => {
    let s = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n");
}
export function learningCsv(groups: Record<string, GroupView>) {
  const rows: unknown[][] = [
    [
      "Skip",
      "Havn",
      "Valg",
      "Begrunnelse",
      "Terninger",
      "Handel",
      "Rykte",
      "Sammenligning",
      "Bro til i dag",
      "Begrunnelse 0–2",
      "Kildebruk 0–2",
      "Perspektiv 0–2",
      "Tilbakemelding",
      "Elevbidrag",
      "Quiz per elev",
    ],
  ];
  for (const g of Object.values(groups))
    for (const s of g.saga)
      rows.push([
        g.shipName,
        s.destName,
        s.choiceTitle,
        s.reason,
        s.roll.dice.join("/"),
        s.trade,
        s.reputation,
        s.historicalComparison,
        s.reflection,
        s.assessment?.reasoning,
        s.assessment?.sourceUse,
        s.assessment?.perspective,
        s.assessment?.feedback,
        Object.entries(s.evidence)
          .map(
            ([uid, v]) =>
              `${g.members[uid]?.label ?? uid}: Fakta: ${v.fact} | Tolkning: ${v.interpretation} | Perspektiv: ${v.perspective} | Kilde: ${v.sourceId}`,
          )
          .join("\n"),
        Object.entries(s.quiz)
          .map(
            ([uid, q]) =>
              `${g.members[uid]?.label ?? uid}: ${q.correct}/${q.total}`,
          )
          .join("\n"),
      ]);
  return csvText(rows);
}

export function feedbackCsv(posts: ReceivedFeedback[]) {
  return csvText([
    ["Mottatt", "Tilbakemelding", "Kommentar", "Havn", "Steg", "Øktmerke"],
    ...posts.map((p) => [
      new Date(p.receivedAt).toISOString(),
      feedbackLabel(p),
      p.comment,
      content.ports.find((c) => c.port.id === p.destId)?.port.name ??
        p.destId ??
        "",
      FEEDBACK_SCREENS[p.screen] ?? p.screen,
      p.okt,
    ]),
  ]);
}
