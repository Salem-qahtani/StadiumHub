import type { ReactNode } from "react";
import "./Badge.css";

type Tone = "success" | "danger" | "neutral" | "warning";

function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default Badge;
