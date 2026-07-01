import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: string }) {
    const labels: Record<string, string> = {
        validation_failed: 'incomplete',
        pending_review: 'pending review',
    };
    const normalized = labels[status] ?? status.replaceAll('_', ' ');
    const tone =
        status === 'accepted' || status === 'confirmed'
            ? 'green'
            : status === 'blocked'
              ? 'red'
              : status === 'validation_failed'
                ? 'amber'
                : status === 'pending_review'
                  ? 'amber'
                  : status === 'checked_in'
                    ? 'blue'
                    : 'neutral';

    return <Badge tone={tone}>{normalized}</Badge>;
}
