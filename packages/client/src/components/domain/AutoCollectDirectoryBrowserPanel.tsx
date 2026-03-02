import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type { LiveDirectoryEntry } from '~/api';
import { Button } from '~/components/ui/Button';
import { Notice } from '~/components/ui/Notice';
import { ArrowUpIcon } from '~/icons';

interface AutoCollectDirectoryBrowserPanelProps {
    loading: boolean;
    currentPath: string;
    parentPath: string | null;
    roots: string[];
    entries: LiveDirectoryEntry[];
    onLoadDirectories: (targetPath?: string) => void;
    onUsePath: (path: string) => void;
}

export const AutoCollectDirectoryBrowserPanel = ({
    loading,
    currentPath,
    parentPath,
    roots,
    entries,
    onLoadDirectories,
    onUsePath,
}: AutoCollectDirectoryBrowserPanelProps) => {
    const [selectedPath, setSelectedPath] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedPath || !entries.some((entry) => entry.path === selectedPath)) {
            setSelectedPath(entries[0]?.path ?? null);
        }
    }, [currentPath, entries, selectedPath]);
    const selectedIndex = useMemo(
        () => entries.findIndex((entry) => entry.path === selectedPath),
        [entries, selectedPath],
    );
    const activeOptionId = selectedIndex >= 0
        ? `auto-collect-folder-option-${selectedIndex}`
        : undefined;

    const selectByIndex = useCallback((nextIndex: number) => {
        if (entries.length === 0) {
            return;
        }
        const boundedIndex = Math.max(0, Math.min(nextIndex, entries.length - 1));
        const nextEntry = entries[boundedIndex];
        if (!nextEntry) {
            return;
        }
        setSelectedPath(nextEntry.path);
    }, [entries]);

    const handleListboxKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if (loading || entries.length === 0) {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectByIndex(selectedIndex < 0 ? 0 : selectedIndex + 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectByIndex(selectedIndex < 0 ? 0 : selectedIndex - 1);
                break;
            case 'Home':
                event.preventDefault();
                selectByIndex(0);
                break;
            case 'End':
                event.preventDefault();
                selectByIndex(entries.length - 1);
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedPath) {
                    onLoadDirectories(selectedPath);
                }
                break;
            default:
                break;
        }
    }, [entries.length, loading, onLoadDirectories, selectByIndex, selectedIndex, selectedPath]);

    const breadcrumbs = useMemo(() => {
        if (!currentPath) {
            return [] as Array<{ label: string; path: string }>;
        }

        const windows = /^[A-Za-z]:/.test(currentPath);
        const unix = currentPath.startsWith('/');
        const parts = currentPath.split(/[/\\]+/).filter(Boolean);
        const result: Array<{ label: string; path: string }> = [];

        if (windows && parts.length > 0) {
            let running = parts[0];
            result.push({ label: parts[0], path: `${parts[0]}\\` });
            for (const part of parts.slice(1)) {
                running = `${running}\\${part}`;
                result.push({ label: part, path: running });
            }
            return result;
        }

        if (unix) {
            let running = '';
            result.push({ label: '/', path: '/' });
            for (const part of parts) {
                running = `${running}/${part}`;
                result.push({ label: part, path: running });
            }
            return result;
        }

        let running = '';
        for (const part of parts) {
            running = running ? `${running}/${part}` : part;
            result.push({ label: part, path: running });
        }
        return result;
    }, [currentPath]);

    return (
        <div className="grid gap-3 rounded-token-md border border-line bg-surface-raised p-3 shadow-surface">
            <div className="grid gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">Current Folder</div>
                <div className="flex flex-wrap items-center gap-1 rounded-token-sm border border-line bg-surface-muted p-1">
                    {breadcrumbs.length > 0 ? breadcrumbs.map((crumb, index) => (
                        <div key={`${crumb.path}-${crumb.label}`} className="flex items-center">
                            {index > 0 ? <span className="px-1 text-xs text-ink-subtle">/</span> : null}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="!h-11 !px-2 text-xs"
                                onClick={() => {
                                    onLoadDirectories(crumb.path);
                                }}
                            >
                                {crumb.label}
                            </Button>
                        </div>
                    )) : (
                        <span className="px-2 py-1 text-xs text-ink-muted">No folder selected</span>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid min-w-0 flex-1 gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                        Selected Folder
                    </span>
                    <p className="truncate rounded-token-sm border border-line bg-surface-muted px-2 py-1.5 text-xs text-ink-muted">
                        {selectedPath || 'Select a folder from the list'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                            if (!parentPath || loading) {
                                return;
                            }
                            onLoadDirectories(parentPath);
                        }}
                        disabled={!parentPath || loading}
                    >
                        <ArrowUpIcon width={14} height={14} />
                        Up
                    </Button>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                            onLoadDirectories(currentPath || undefined);
                        }}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
                <aside className="rounded-token-sm border border-line bg-surface-muted p-2">
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">
                        Quick Access
                    </p>
                    <div className="grid gap-1">
                        {roots.length > 0 ? roots.map((rootPath) => (
                            <Button
                                key={rootPath}
                                variant={currentPath === rootPath ? 'soft' : 'ghost'}
                                size="md"
                                className="w-full justify-start"
                                onClick={() => {
                                    onLoadDirectories(rootPath);
                                }}
                                disabled={loading}
                            >
                                {rootPath}
                            </Button>
                        )) : (
                            <Notice variant="neutral" className="text-center text-xs">No roots available</Notice>
                        )}
                    </div>
                </aside>

                <section className="rounded-token-sm border border-line bg-surface-muted p-2">
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">
                        Folders ({entries.length})
                    </p>
                    <p className="mb-2 px-2 text-xs text-ink-subtle">
                        Single click to select, double click to open.
                    </p>
                    <div
                        role="listbox"
                        aria-label="Folders"
                        aria-activedescendant={activeOptionId}
                        tabIndex={0}
                        onKeyDown={handleListboxKeyDown}
                        className="max-h-[36vh] min-h-[220px] overflow-auto rounded-token-sm border border-line bg-surface-raised p-2"
                    >
                        {loading ? (
                            <Notice variant="neutral" className="text-center">Loading folders...</Notice>
                        ) : null}

                        {!loading && entries.length === 0 ? (
                            <Notice variant="neutral" className="text-center">No subfolders in this location</Notice>
                        ) : null}

                        {!loading && entries.length > 0 ? (
                            <div className="grid gap-1">
                                {entries.map((entry, index) => (
                                    <Button
                                        key={entry.path}
                                        id={`auto-collect-folder-option-${index}`}
                                        role="option"
                                        variant={selectedPath === entry.path ? 'soft' : 'ghost'}
                                        size="md"
                                        className="w-full justify-start"
                                        aria-selected={selectedPath === entry.path}
                                        tabIndex={-1}
                                        onClick={() => {
                                            setSelectedPath(entry.path);
                                        }}
                                        onDoubleClick={() => {
                                            onLoadDirectories(entry.path);
                                        }}
                                    >
                                        <span className="truncate">{entry.name}</span>
                                    </Button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
                <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                        if (!selectedPath) {
                            return;
                        }
                        onLoadDirectories(selectedPath);
                    }}
                    disabled={!selectedPath || loading}
                >
                    Open Selected
                </Button>
                <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                        if (!currentPath) {
                            return;
                        }
                        onUsePath(currentPath);
                    }}
                    disabled={!currentPath}
                >
                    Use Current Folder
                </Button>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                        if (!selectedPath) {
                            return;
                        }
                        onUsePath(selectedPath);
                    }}
                    disabled={!selectedPath}
                >
                    Use Selected Folder
                </Button>
            </div>
        </div>
    );
};
