import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const DEFAULT_SIZE = 18;

const defaultProps: IconProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

export const ArrowDownIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
);

export const ArrowUpIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

export const CrossIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M20 20L4 4m16 0L4 20" />
    </svg>
);

export const DataIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <ellipse cx={12} cy={6} rx={8} ry={3} />
        <path d="M6.037 12C4.77 12.53 4 13.232 4 14c0 1.657 3.582 3 8 3s8-1.343 8-3c0-.768-.77-1.47-2.037-2" />
        <path d="M4 6v4c0 1.657 3.582 3 8 3s8-1.343 8-3V6" />
        <path d="M4 14v4c0 1.657 3.582 3 8 3s8-1.343 8-3v-4" />
    </svg>
);

export const DeleteIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M4 6h16l-1.58 14.22A2 2 0 0 1 16.432 22H7.568a2 2 0 0 1-1.988-1.78L4 6z" />
        <path d="M7.345 3.147A2 2 0 0 1 9.154 2h5.692a2 2 0 0 1 1.81 1.147L18 6H6l1.345-2.853z" />
        <path d="M2 6h20" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
    </svg>
);

export const DraftIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M13.5 6v4H16m-1.315-8H10a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2z" />
        <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
    </svg>
);

export const GridIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <rect x={3} y={3} width={7} height={7} />
        <rect x={14} y={3} width={7} height={7} />
        <rect x={14} y={14} width={7} height={7} />
        <rect x={3} y={14} width={7} height={7} />
    </svg>
);

export const HeartIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M7 3C4.239 3 2 5.216 2 7.95c0 2.207.875 7.445 9.488 12.74a.985.985 0 0 0 1.024 0C21.125 15.395 22 10.157 22 7.95 22 5.216 19.761 3 17 3s-5 3-5 3-2.239-3-5-3z" />
    </svg>
);

export const ImageIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M2 6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6z" />
        <circle cx={8.5} cy={8.5} r={2.5} />
        <path d="M14.526 12.621L6 22h12.133A3.867 3.867 0 0 0 22 18.133V18c0-.466-.175-.645-.49-.99l-4.03-4.395a2 2 0 0 0-2.954.006z" />
    </svg>
);

export const ListIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M3 6h18M3 12h10M3 18h15" />
    </svg>
);

export const MenuIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
);

export const MoreIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <circle cx={5} cy={12} r={1} />
        <circle cx={12} cy={12} r={1} />
        <circle cx={19} cy={12} r={1} />
    </svg>
);

export const DragHandleIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <circle cx={9} cy={6} r={1} />
        <circle cx={15} cy={6} r={1} />
        <circle cx={9} cy={12} r={1} />
        <circle cx={15} cy={12} r={1} />
        <circle cx={9} cy={18} r={1} />
        <circle cx={15} cy={18} r={1} />
    </svg>
);

export const PauseIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M7 5v14M17 5v14" />
    </svg>
);

export const PlayIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M6 4v16" />
        <path d="M20 12L6 20" />
        <path d="M20 12L6 4" />
    </svg>
);

export const PlusIcon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={DEFAULT_SIZE} height={DEFAULT_SIZE} {...defaultProps} {...props}>
        <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4" />
    </svg>
);
