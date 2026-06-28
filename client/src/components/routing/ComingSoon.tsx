import EmptyState from "../ui/EmptyState/EmptyState";
import { ClockIcon } from "../ui/icons";

// Temporary placeholder for routes that are wired but not built yet.
// Each page replaces its placeholder as we build it.
function ComingSoon({ title }: { title: string }) {
  return (
    <EmptyState
      icon={<ClockIcon size={28} />}
      title={`${title} — coming soon`}
      message="This page hasn't been built yet. We're working through them one at a time."
    />
  );
}

export default ComingSoon;
