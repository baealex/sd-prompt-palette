import type { LucideIcon, LucideProps } from 'lucide-react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Calendar,
    ChevronDown,
    Database,
    Ellipsis,
    FileText,
    GripVertical,
    Grid2x2,
    Heart,
    Image,
    List,
    Menu,
    LoaderCircle,
    Pause,
    Play,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';

type IconProps = LucideProps;

const DEFAULT_SIZE = 18;
const DEFAULT_STROKE_WIDTH = 2;

const withDefaults = (IconComponent: LucideIcon) => (props: IconProps) => (
    <IconComponent size={DEFAULT_SIZE} strokeWidth={DEFAULT_STROKE_WIDTH} {...props} />
);

export const ArrowDownIcon = withDefaults(ArrowDown);
export const CalendarIcon = withDefaults(Calendar);
export const ChevronDownIcon = withDefaults(ChevronDown);
export const ArrowUpIcon = withDefaults(ArrowUp);
export const ArrowLeftIcon = withDefaults(ArrowLeft);
export const ArrowRightIcon = withDefaults(ArrowRight);
export const CrossIcon = withDefaults(X);
export const DataIcon = withDefaults(Database);
export const DeleteIcon = withDefaults(Trash2);
export const DraftIcon = withDefaults(FileText);
export const GridIcon = withDefaults(Grid2x2);
export const HeartIcon = withDefaults(Heart);
export const ImageIcon = withDefaults(Image);
export const ListIcon = withDefaults(List);
export const MenuIcon = withDefaults(Menu);
export const LoaderIcon = withDefaults(LoaderCircle);
export const MoreIcon = withDefaults(Ellipsis);
export const SearchIcon = withDefaults(Search);
export const DragHandleIcon = withDefaults(GripVertical);
export const PauseIcon = withDefaults(Pause);
export const PlayIcon = withDefaults(Play);
export const PlusIcon = withDefaults(Plus);
