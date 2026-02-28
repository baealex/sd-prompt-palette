import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect } from 'react';

import { Button } from '~/components/ui/Button';
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
        togglingEnabled,
        savingSettings,
        settingsOpen,
        statusEnabled,
        watchDirLabel,
        modeLabel,
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
            <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-token-md border border-line bg-surface-muted px-2.5 py-1.5">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <div className="flex items-center gap-1 rounded-token-md border border-line bg-surface-base pl-3 pr-2">
                        <span className="text-[11px] font-semibold text-ink">
                            Auto Collect
                        </span>
                        <Switch
                            checked={statusEnabled}
                            label="Auto Collect"
                            disabled={loadingConfig || togglingEnabled}
                            onCheckedChange={() => {
                                void handleToggleEnabled();
                            }}
                        />
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                        <span className="max-w-[420px] truncate">
                            Watching: {watchDirLabel}
                        </span>
                        <span className="text-ink-subtle">|</span>
                        <span>Mode: {modeLabel}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            void handleCollectNow();
                        }}
                        disabled={collectingNow || loadingConfig}
                    >
                        {collectingNow ? 'Collecting...' : 'Collect now'}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenSettings}
                    >
                        Settings
                    </Button>
                </div>
            </div>

            <DialogPrimitive.Root
                open={settingsOpen}
                onOpenChange={handleSettingsOpenChange}
            >
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay/50" />
                    <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-40 flex max-h-[calc(100vh-1.5rem)] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-token-lg border border-line bg-surface-base p-4 shadow-overlay ui-focus-ring">
                        <DialogPrimitive.Title className="text-lg font-semibold text-ink">
                            Auto Collect Settings
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description className="mt-1 text-sm text-ink-muted">
                            Configure Watch Folder, transfer mode, and Auto
                            Collect behavior.
                        </DialogPrimitive.Description>

                        <div className="mt-4 grid flex-1 gap-3 overflow-y-auto pr-1">
                            <section className="grid gap-3 rounded-token-md border border-line bg-surface-muted p-3">
                                <h3 className="text-sm font-semibold text-ink">
                                    Basic
                                </h3>
                                <label className="grid gap-1 text-sm font-semibold text-ink-muted">
                                    Watch Folder
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
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
                                            size="sm"
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

                                {directoryBrowserVisible ? (
                                    <AutoCollectDirectoryBrowserPanel
                                        loading={directoryBrowserLoading}
                                        currentPath={directoryCurrentPath}
                                        parentPath={directoryParentPath}
                                        roots={directoryRoots}
                                        entries={directoryEntries}
                                        onLoadDirectories={(targetPath) => {
                                            void loadServerDirectories(
                                                targetPath,
                                            );
                                        }}
                                        onUsePath={setDraftWatchDir}
                                    />
                                ) : null}

                                <FieldChoice
                                    type="checkbox"
                                    checked={draftEnabled}
                                    onChange={setDraftEnabled}
                                    label="Enable Auto Collect"
                                />
                            </section>

                            <section className="grid gap-2 rounded-token-md border border-line bg-surface-muted p-3">
                                <h3 className="text-sm font-semibold text-ink">
                                    Transfer Mode
                                </h3>
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

                            <section className="grid gap-1 rounded-token-md border border-line bg-surface-muted p-3">
                                <h3 className="text-sm font-semibold text-ink">
                                    Advanced
                                </h3>
                                <p className="text-xs text-ink-muted">
                                    Collect now performs a one-time scan
                                    immediately.
                                </p>
                                <p className="text-xs text-ink-muted">
                                    Auto Collect watches the selected folder
                                    continuously.
                                </p>
                            </section>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <DialogPrimitive.Close asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogPrimitive.Close>
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
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </>
    );
};
