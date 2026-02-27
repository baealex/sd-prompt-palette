import { useCallback, useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

export interface ContextMenuSubItem {
    label: string;
    click?: () => void;
}

export interface ContextMenuItem {
    label: string;
    click?: () => void;
    subMenus?: ContextMenuSubItem[];
}

export interface ContextMenuState {
    open: boolean;
    top: number;
    left: number;
    menus: ContextMenuItem[];
}

const INITIAL_STATE: ContextMenuState = {
    open: false,
    top: 0,
    left: 0,
    menus: [],
};

export function useContextMenu() {
    const [state, setState] = useState<ContextMenuState>(INITIAL_STATE);

    const open = useCallback((event: MouseEvent | ReactMouseEvent, menus: ContextMenuItem[]) => {
        event.preventDefault();
        const top = event.clientY + window.scrollY + 4;
        const left = event.clientX + window.scrollX + 4;
        setState({
            open: true,
            top,
            left,
            menus,
        });
    }, []);

    const close = useCallback(() => {
        setState((prev) => ({ ...prev, open: false }));
    }, []);

    const api = useMemo(() => ({
        state,
        open,
        close,
    }), [state, open, close]);

    return api;
}
