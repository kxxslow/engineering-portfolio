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

export function HandoffWorkspace({
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
      className={inspector ? "handoffWorkspace" : "handoffWorkspace handoffNoInspector"}
    >
      <aside className="handoffFilterRail" aria-label={`${filterTitle} scope`}>
        <p className="handoffFilterEyebrow">Scope</p>
        <h2>{filterTitle}</h2>
        {filterSubtitle ? <p className="handoffFilterSubtitle">{filterSubtitle}</p> : null}
        <div className="handoffFilterSections">
          {sections.map((section) => (
            <div className="handoffFilterSection" key={section.title}>
              <h3>{section.title}</h3>
              {section.subtitle ? <p>{section.subtitle}</p> : null}
              <div className="handoffFilterList">
                {section.items.map((item) => (
                  <div
                    className={item.active ? "handoffFilterItem active" : "handoffFilterItem"}
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
      <div className="handoffMainPane">{children}</div>
      {inspector ? <aside className="handoffInspector">{inspector}</aside> : null}
    </section>
  );
}

export function HandoffTitle({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="handoffTitleRow">
      <div className="handoffTitleCopy">
        <h2>{title}</h2>
        {meta ? <p>{meta}</p> : null}
      </div>
      {action ? <div className="handoffTitleAction">{action}</div> : null}
    </div>
  );
}

export function DetailRows({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="handoffDetailRows">
      {rows.map((row) => (
        <div className="handoffDetailRow" key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
