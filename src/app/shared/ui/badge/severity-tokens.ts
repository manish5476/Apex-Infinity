// src/app/shared/ui/badge/severity-tokens.ts
export type StatusSeverity = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
export type BadgeVariant = 'subtle' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface SeverityPalette {
    subtle: string;
    solid: string;
    outline: string;
    dot: string;
}

const PALETTE: Record<StatusSeverity, SeverityPalette> = {
    success: {
        subtle: 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)] border-[var(--color-success-border)]',
        solid: 'bg-[var(--color-success)] text-[var(--text-on-success)] border-transparent',
        outline: 'bg-transparent text-[var(--color-success-dark)] border-[var(--color-success)]',
        dot: 'bg-[var(--color-success)]',
    },
    warning: {
        subtle: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-dark)] border-[var(--color-warning-border)]',
        solid: 'bg-[var(--color-warning)] text-[var(--text-on-warning)] border-transparent',
        outline: 'bg-transparent text-[var(--color-warning-dark)] border-[var(--color-warning)]',
        dot: 'bg-[var(--color-warning)]',
    },
    danger: {
        subtle: 'bg-[var(--color-error-bg)] text-[var(--color-error-dark)] border-[var(--color-error-border)]',
        solid: 'bg-[var(--color-error)] text-[var(--text-on-error)] border-transparent',
        outline: 'bg-transparent text-[var(--color-error-dark)] border-[var(--color-error)]',
        dot: 'bg-[var(--color-error)]',
    },
    info: {
        subtle: 'bg-[var(--color-info-bg)] text-[var(--color-info-dark)] border-[var(--color-info-border)]',
        solid: 'bg-[var(--color-info)] text-[var(--text-on-info)] border-transparent',
        outline: 'bg-transparent text-[var(--color-info-dark)] border-[var(--color-info)]',
        dot: 'bg-[var(--color-info)]',
    },
    neutral: {
        subtle: 'bg-[var(--bg-ternary)] text-[var(--text-secondary)] border-[var(--border-secondary)]',
        solid: 'bg-[var(--text-secondary)] text-[var(--bg-primary)] border-transparent',
        outline: 'bg-transparent text-[var(--text-secondary)] border-[var(--border-secondary)]',
        dot: 'bg-[var(--text-secondary)]',
    },
    accent: {
        subtle: 'bg-[var(--accent-focus)] text-[var(--accent-primary)] border-[var(--accent-secondary)]',
        solid: 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-transparent',
        outline: 'bg-transparent text-[var(--accent-primary)] border-[var(--accent-primary)]',
        dot: 'bg-[var(--accent-primary)]',
    },
};

export function getSeverityColorClasses(severity: StatusSeverity, variant: BadgeVariant): string {
    return PALETTE[severity][variant];
}

export function getSeverityDotClass(severity: StatusSeverity, variant: BadgeVariant): string {
    return variant === 'solid' ? 'bg-current opacity-90' : PALETTE[severity].dot;
}

const STATUS_KEYWORD_MAP: Record<string, StatusSeverity> = {
    active: 'success', completed: 'success', paid: 'success', approved: 'success',
    success: 'success', delivered: 'success', enabled: 'success', resolved: 'success',
    pending: 'warning', in_progress: 'warning', processing: 'warning', warning: 'warning',
    review: 'warning', trial: 'warning', unpaid: 'warning',
    failed: 'danger', cancelled: 'danger', overdue: 'danger', suspended: 'danger',
    danger: 'danger', rejected: 'danger', error: 'danger', disabled: 'danger',
    draft: 'neutral', neutral: 'neutral', inactive: 'neutral', archived: 'neutral',
    closed: 'neutral', hold: 'neutral',
    info: 'info', sent: 'info', open: 'info', queued: 'info', new: 'info',
};

export function resolveSeverityFromStatus(status: string): StatusSeverity {
    if (!status) return 'accent';
    return STATUS_KEYWORD_MAP[status.toLowerCase().trim()] ?? 'accent';
}