import type { ReactNode } from "react";

export type FilterTone = "blue" | "green" | "amber" | "red" | "muted";

export interface FilterItem {
  label: string;
  value?: string | number;
  tone?: FilterTone;
  active?: boolean;
}

export interface FilterSection {
  title: string;
  subtitle?: string;
  items: FilterItem[];
}

export function ConsoleWorkspace({
  filterTitle,
  filterSubtitle,
  sections,
  children,
  inspector,
}: {
  filterTitle: string;
  filterSubtitle?: string;
  sections: FilterSection[];
  children: ReactNode;
  inspector?: ReactNode;
}) {
  return (
    <section
      className={inspector ? "consoleWorkspace" : "consoleWorkspace consoleNoInspector"}
    >
      <aside className="consoleFilterRail" aria-label={`${filterTitle} scope`}>
        <p className="consoleFilterEyebrow">Scope</p>
        <h2>{filterTitle}</h2>
        {filterSubtitle ? <p className="consoleFilterSubtitle">{filterSubtitle}</p> : null}
        <div className="consoleFilterSections">
          {sections.map((section) => (
            <div className="consoleFilterSection" key={section.title}>
              <h3>{section.title}</h3>
              {section.subtitle ? <p>{section.subtitle}</p> : null}
              <div className="consoleFilterList">
                {section.items.map((item) => (
                  <div
                    className={item.active ? "consoleFilterItem active" : "consoleFilterItem"}
                    key={`${section.title}-${item.label}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`filterDot filterDot-${item.tone ?? "blue"}`}
                    />
                    <span>{item.label}</span>
                    {item.value !== undefined ? <strong>{item.value}</strong> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
      <div className="consoleMainPane">{children}</div>
      {inspector ? <aside className="consoleInspector">{inspector}</aside> : null}
    </section>
  );
}

export function ConsoleTitle({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="consoleTitleRow">
      <div className="consoleTitleCopy">
        <h2>{title}</h2>
        {meta ? <p>{meta}</p> : null}
      </div>
      {action ? <div className="consoleTitleAction">{action}</div> : null}
    </div>
  );
}

export function DetailRows({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="consoleDetailRows">
      {rows.map((row) => (
        <div className="consoleDetailRow" key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
