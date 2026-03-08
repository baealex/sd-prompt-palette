import { useEffect } from 'react';

import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from '~/components/ui/Dialog';
import { FieldChoice } from '~/components/ui/FieldChoice';
import { Input } from '~/components/ui/Input';
import { Switch } from '~/components/ui/Switch';
import { useToast } from '~/components/ui/ToastProvider';
import { normalizeWatchDir } from '~/features/collection/live-config-utils';
import { useAutoCollectControl } from '~/features/collection/use-auto-collect-control';

import { AutoCollectDirectoryBrowserPanel } from './AutoCollectDirectoryBrowserPanel';

export const CollectionRealtimeControl = () => {
    const { pushToast } = useToast();

    const {
        feedback,
        loadingConfig,
        collectingNow,
        statusSyncing,
        statusSyncReason,
        statusSyncScanned,
        statusSyncUpdatedAt,
        togglingEnabled,
        savingSettings,
        settingsOpen,
        statusEnabled,
        draftWatchDir,
        draftIngestMode,
        draftDeleteSourceOnDelete,
        draftEnabled,
        normalizedDraftWatchDir,
        hasDraftChanges,
        directoryBrowserVisible,
        directoryBrowserLoading,
        directoryCurrentPath,
        directoryParentPath,
        directoryRoots,
        directoryEntries,
        liveConfig,
        setDraftWatchDir,
        setDraftIngestMode,
        setDraftDeleteSourceOnDelete,
        setDraftEnabled,
        setDirectoryBrowserVisible,
        loadServerDirectories,
        handleOpenSettings,
        handleSettingsOpenChange,
        handleToggleEnabled,
        handleCollectNow,
        handleSaveSettings,
    } = useAutoCollectControl();

    const collecting = collectingNow || statusSyncing;
    const lastSyncTimeLabel =
        typeof statusSyncUpdatedAt === 'number'
            ? new Date(statusSyncUpdatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
              })
            : null;
    const statusSummary = collecting
        ? `Syncing now${statusSyncReason ? ` (${statusSyncReason})` : ''}`
        : typeof statusSyncScanned === 'number'
          ? `Last sync scanned ${statusSyncScanned} file${statusSyncScanned === 1 ? '' : 's'}${lastSyncTimeLabel ? ` at ${lastSyncTimeLabel}` : ''}`
          : 'Watch a folder and import new images';

    useEffect(() => {
        if (!feedback) {
            return;
        }
        pushToast({
            variant: feedback.variant,
            message: feedback.message,
        });
    }, [feedback, pushToast]);

    return (
        <>
            <Card as="section" padding="sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={statusEnabled}
                            label="Auto Collect"
                            disabled={loadingConfig || togglingEnabled}
                            onCheckedChange={() => {
                                void handleToggleEnabled();
                            }}
                        />
                        <div className="min-w-0">
                            <span className="text-sm font-semibold text-ink">
                                Auto Collect
                            </span>
                            <p className="text-xs text-ink-muted">
                                {statusSummary}
                            </p>
                        </div>
                        {loadingConfig || collecting ? (
                            <Badge variant="neutral">
                                {collecting ? 'Collecting...' : 'Syncing...'}
                            </Badge>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                void handleCollectNow();
                            }}
                            disabled={collecting || loadingConfig}
                        >
                            {collecting ? 'Collecting...' : 'Collect now'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleOpenSettings}
                        >
                            Settings
                        </Button>
                    </div>
                </div>
            </Card>

            <DialogRoot
                open={settingsOpen}
                onOpenChange={handleSettingsOpenChange}
            >
                <DialogPortal>
                    <DialogOverlay className="bg-overlay/50" />
                    <DialogContent className="z-40 flex !h-[calc(100vh-1rem)] !w-[98vw] !max-w-[1500px] flex-col bg-surface-raised p-5 sm:p-6">
                        <DialogTitle>Auto Collect Settings</DialogTitle>
                        <DialogDescription>
                            Configure Watch Folder, transfer mode, and Auto
                            Collect behavior.
                        </DialogDescription>
                        {hasDraftChanges ? (
                            <div className="mt-2">
                                <Badge variant="warning">Unsaved changes</Badge>
                            </div>
                        ) : null}

                        <div className="mt-4 grid gap-2 rounded-token-md border border-line bg-surface-muted p-3 sm:grid-cols-3">
                            <div className="rounded-token-sm border border-line bg-surface-raised px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                                    Step 1
                                </p>
                                <p className="mt-1 text-sm font-semibold text-ink">
                                    Pick Watch Folder
                                </p>
                            </div>
                            <div className="rounded-token-sm border border-line bg-surface-raised px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                                    Step 2
                                </p>
                                <p className="mt-1 text-sm font-semibold text-ink">
                                    Choose Copy or Move
                                </p>
                            </div>
                            <div className="rounded-token-sm border border-line bg-surface-raised px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                                    Step 3
                                </p>
                                <p className="mt-1 text-sm font-semibold text-ink">
                                    Save Settings
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid flex-1 gap-4 overflow-y-auto pr-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                            <section className="grid content-start gap-3 rounded-token-md border border-line bg-surface-muted p-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-ink">
                                        Watch Folder
                                    </h3>
                                    <p className="mt-1 text-xs text-ink-muted">
                                        Select the server folder to watch for
                                        new images.
                                    </p>
                                </div>
                                <label className="grid gap-1 text-sm font-semibold text-ink-muted">
                                    Path
                                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                        <Input
                                            value={draftWatchDir}
                                            onChange={(event) =>
                                                setDraftWatchDir(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="C:\\path\\to\\watch"
                                        />
                                        <Button
                                            variant="secondary"
                                            size="md"
                                            onClick={() => {
                                                const willOpen =
                                                    !directoryBrowserVisible;
                                                setDirectoryBrowserVisible(
                                                    willOpen,
                                                );
                                                if (!willOpen) {
                                                    return;
                                                }
                                                const initialPath =
                                                    normalizeWatchDir(
                                                        draftWatchDir,
                                                    ) ||
                                                    normalizeWatchDir(
                                                        liveConfig?.watchDir ||
                                                            '',
                                                    ) ||
                                                    undefined;
                                                void loadServerDirectories(
                                                    initialPath,
                                                );
                                            }}
                                        >
                                            {directoryBrowserVisible
                                                ? 'Hide Browser'
                                                : 'Browse Server'}
                                        </Button>
                                    </div>
                                </label>
                                <p className="text-xs text-ink-subtle">
                                    Active path:{' '}
                                    <span className="font-medium text-ink">
                                        {normalizedDraftWatchDir || 'Not set'}
                                    </span>
                                </p>

                                {directoryBrowserVisible ? (
                                    <AutoCollectDirectoryBrowserPanel
                                        loading={directoryBrowserLoading}
                                        currentPath={directoryCurrentPath}
                                        parentPath={directoryParentPath}
                                        roots={directoryRoots}
                                        entries={directoryEntries}
                                        onLoadDirectories={
                                            loadServerDirectories
                                        }
                                        onUsePath={setDraftWatchDir}
                                    />
                                ) : null}
                            </section>

                            <div className="grid content-start gap-4">
                                <section className="grid gap-2 rounded-token-md border border-line bg-surface-muted p-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-ink">
                                            Auto Collect
                                        </h3>
                                        <p className="mt-1 text-xs text-ink-muted">
                                            Turn background collection on or
                                            off.
                                        </p>
                                    </div>
                                    <FieldChoice
                                        type="checkbox"
                                        checked={draftEnabled}
                                        onChange={setDraftEnabled}
                                        label="Enable Auto Collect"
                                    />
                                </section>

                                <section className="grid gap-2 rounded-token-md border border-line bg-surface-muted p-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-ink">
                                            Transfer Mode
                                        </h3>
                                        <p className="mt-1 text-xs text-ink-muted">
                                            Choose whether files are copied or
                                            moved into your library.
                                        </p>
                                    </div>
                                    <FieldChoice
                                        type="radio"
                                        name="collect-mode"
                                        value="copy"
                                        checked={draftIngestMode === 'copy'}
                                        onChange={(nextChecked) => {
                                            if (nextChecked) {
                                                setDraftIngestMode('copy');
                                            }
                                        }}
                                        label="Copy files to library (safe default)"
                                    />
                                    <FieldChoice
                                        type="radio"
                                        name="collect-mode"
                                        value="move"
                                        checked={draftIngestMode === 'move'}
                                        onChange={(nextChecked) => {
                                            if (nextChecked) {
                                                setDraftIngestMode('move');
                                            }
                                        }}
                                        label="Move files to library"
                                    />
                                    <FieldChoice
                                        type="checkbox"
                                        checked={draftDeleteSourceOnDelete}
                                        onChange={setDraftDeleteSourceOnDelete}
                                        disabled={draftIngestMode !== 'copy'}
                                        label="Also delete source file when deleting from collection"
                                    />
                                </section>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    void handleSaveSettings();
                                }}
                                disabled={
                                    savingSettings ||
                                    !hasDraftChanges ||
                                    !normalizedDraftWatchDir
                                }
                            >
                                {savingSettings ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </DialogContent>
                </DialogPortal>
            </DialogRoot>
        </>
    );
};
