function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringified = String(value).replace(/"/g, '""');
  return /[",\n]/.test(stringified) ? `"${stringified}"` : stringified;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function downloadCsv(
  filename: string,
  columns: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const lines = [
    columns.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadSectionedCsv(
  filename: string,
  sections: Array<{
    title: string;
    columns: string[];
    rows: Array<Array<string | number | null | undefined>>;
  }>
) {
  const content = sections
    .map((section) => {
      const header = section.columns.map(escapeCell).join(",");
      const rows = section.rows.map((row) => row.map(escapeCell).join(",")).join("\n");
      return [section.title, header, rows].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPrintableReport({
  title,
  subtitle,
  generatedAt,
  metrics,
  sections,
}: {
  title: string;
  subtitle?: string;
  generatedAt?: string;
  metrics?: Array<{ label: string; value: string; note?: string }>;
  sections: Array<{
    title: string;
    columns: string[];
    rows: Array<Array<string | number | null | undefined>>;
  }>;
}) {
  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) return;

  const metricsHtml =
    metrics && metrics.length > 0
      ? `
        <section class="metrics">
          ${metrics
            .map(
              (metric) => `
                <article class="metric-card">
                  <p class="metric-label">${escapeHtml(metric.label)}</p>
                  <p class="metric-value">${escapeHtml(metric.value)}</p>
                  ${metric.note ? `<p class="metric-note">${escapeHtml(metric.note)}</p>` : ""}
                </article>
              `
            )
            .join("")}
        </section>
      `
      : "";

  const sectionsHtml = sections
    .map(
      (section) => `
        <section class="report-section">
          <h2>${escapeHtml(section.title)}</h2>
          <table>
            <thead>
              <tr>${section.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${section.rows
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </section>
      `
    )
    .join("");

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            color-scheme: light;
            --green: #1f4120;
            --green-soft: #eff5ea;
            --amber: #c4941a;
            --text: #223118;
            --muted: #667267;
            --line: #dde7d6;
            --surface: #ffffff;
            --page: #f7f2e8;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 40px;
            font-family: "DM Sans", "Segoe UI", sans-serif;
            background: var(--page);
            color: var(--text);
          }
          .page {
            max-width: 1100px;
            margin: 0 auto;
          }
          .hero {
            padding: 28px 32px;
            border-radius: 28px;
            background: linear-gradient(135deg, #ffffff, #f7fbf4);
            border: 1px solid var(--line);
            box-shadow: 0 18px 50px rgba(27, 45, 16, 0.08);
          }
          .eyebrow {
            margin: 0 0 10px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--muted);
          }
          h1 {
            margin: 0;
            font-size: 34px;
            line-height: 1.05;
          }
          .subtitle {
            margin: 12px 0 0;
            color: var(--muted);
            max-width: 760px;
            line-height: 1.6;
          }
          .generated {
            margin-top: 16px;
            font-size: 13px;
            color: var(--muted);
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin: 24px 0 0;
          }
          .metric-card {
            padding: 18px 20px;
            border-radius: 20px;
            background: var(--surface);
            border: 1px solid var(--line);
          }
          .metric-label {
            margin: 0 0 10px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .metric-value {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            color: var(--green);
          }
          .metric-note {
            margin: 8px 0 0;
            font-size: 13px;
            color: var(--muted);
          }
          .report-section {
            margin-top: 28px;
            padding: 24px 26px;
            border-radius: 24px;
            background: var(--surface);
            border: 1px solid var(--line);
          }
          h2 {
            margin: 0 0 18px;
            font-size: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td {
            padding: 12px 10px;
            border-bottom: 1px solid var(--line);
            text-align: left;
          }
          th {
            font-size: 11px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--muted);
          }
          tr:last-child td {
            border-bottom: none;
          }
          @media print {
            body { padding: 0; background: white; }
            .page { max-width: none; }
            .hero, .report-section, .metric-card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="hero">
            <p class="eyebrow">Netsurf Reports</p>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
            ${generatedAt ? `<p class="generated">Generated ${escapeHtml(generatedAt)}</p>` : ""}
            ${metricsHtml}
          </section>
          ${sectionsHtml}
        </main>
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
}
