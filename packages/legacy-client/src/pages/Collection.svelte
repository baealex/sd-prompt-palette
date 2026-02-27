<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { derived, get } from "svelte/store";
    import { toast } from "@baejino/ui";
    import { io, Socket } from "socket.io-client";

    import { collectionState } from "~/models/collection";
    import type { CollectionState } from "~/models/collection";
    import type {
        LiveConfig,
        LiveDirectoryEntry,
        LiveStatusResponse,
    } from "~/api";

    import { CollectionNav, CollectionCard } from "~/components";

    import { useMemoState } from "~/modules/memo";

    import {
        getCollections,
        getLiveConfig,
        listLiveDirectories,
        syncLiveImages,
        updateLiveConfig,
    } from "~/api";

    import pathStore from "~/store/path";

    let page = 1;
    let lastPage = 1;
    const limit = 20;
    const query = new URLSearchParams(location.search).get("query") || "";
    let [collections, memoCollections] = useMemoState<CollectionState[]>(
        "collections",
        [],
    );
    let loadingMore = false;
    let socket: Socket | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    let settingsOpen = false;
    let savingSettings = false;
    let syncingNow = false;

    let directoryBrowserOpen = false;
    let directoryBrowserLoading = false;
    let directoryCurrentPath = "";
    let directoryParentPath: string | null = null;
    let directoryRoots: string[] = [];
    let directoryEntries: LiveDirectoryEntry[] = [];

    let liveConfig: LiveConfig = {
        watchDir: "",
        ingestMode: "copy",
        deleteSourceOnDelete: false,
        enabled: false,
        updatedAt: Date.now(),
    };

    let draftWatchDir = "";
    let draftIngestMode: "copy" | "move" = "copy";
    let draftDeleteSourceOnDelete = false;
    let draftEnabled = false;

    $: resolveCollections = derived(collections, () =>
        collections.map((collection) => ({
            ...collection,
            ...get(collection),
        })),
    );

    async function loadCollections(nextPage: number, append = false) {
        const { data } = await getCollections({
            page: nextPage,
            limit,
            query,
        });

        lastPage = Math.max(
            1,
            Math.ceil(data.allCollections.pagination.total / limit),
        );
        const nextCollections =
            data.allCollections.collections.map(collectionState);

        collections = append
            ? [...collections, ...nextCollections]
            : nextCollections;
    }

    async function loadSyncConfig() {
        try {
            const { data } = await getLiveConfig();
            liveConfig = data.config;
            resetDraftFromConfig();
        } catch (error) {
            console.error(error);
            toast("Failed to load sync settings");
        }
    }

    function resetDraftFromConfig() {
        draftWatchDir = liveConfig.watchDir || "";
        draftIngestMode = liveConfig.ingestMode || "copy";
        draftDeleteSourceOnDelete = Boolean(liveConfig.deleteSourceOnDelete);
        draftEnabled = Boolean(liveConfig.enabled);
    }

    function openSettingsModal() {
        resetDraftFromConfig();
        settingsOpen = true;
    }

    function closeSettingsModal() {
        settingsOpen = false;
        directoryBrowserOpen = false;
    }

    async function loadServerDirectories(targetPath?: string) {
        directoryBrowserLoading = true;
        try {
            const { data } = await listLiveDirectories(
                targetPath ? { path: targetPath } : {},
            );

            if (!data.ok) {
                toast(data.message || "Failed to browse server directories");
                return;
            }

            directoryCurrentPath = data.currentPath || "";
            directoryParentPath = data.parentPath || null;
            directoryRoots = Array.isArray(data.roots) ? data.roots : [];
            directoryEntries = Array.isArray(data.directories)
                ? data.directories
                : [];
        } catch (error) {
            console.error(error);
            toast("Failed to browse server directories");
        } finally {
            directoryBrowserLoading = false;
        }
    }

    function openDirectoryBrowser() {
        directoryBrowserOpen = true;
        const initialPath =
            draftWatchDir.trim() || liveConfig.watchDir || undefined;
        void loadServerDirectories(initialPath);
    }

    function closeDirectoryBrowser() {
        directoryBrowserOpen = false;
    }

    function browseParentDirectory() {
        if (!directoryParentPath || directoryBrowserLoading) {
            return;
        }
        void loadServerDirectories(directoryParentPath);
    }

    function browseRootDirectory(rootPath: string) {
        if (!rootPath || directoryBrowserLoading) {
            return;
        }
        void loadServerDirectories(rootPath);
    }

    function browseChildDirectory(entry: LiveDirectoryEntry) {
        if (!entry?.path || directoryBrowserLoading) {
            return;
        }
        void loadServerDirectories(entry.path);
    }

    function applySelectedDirectory() {
        if (!directoryCurrentPath) {
            toast("No directory selected");
            return;
        }
        draftWatchDir = directoryCurrentPath;
        directoryBrowserOpen = false;
    }

    async function handleSaveSettings() {
        if (!draftWatchDir.trim()) {
            toast("Watch directory is required");
            return;
        }

        savingSettings = true;
        try {
            const { data } = await updateLiveConfig({
                watchDir: draftWatchDir.trim(),
                ingestMode: draftIngestMode,
                deleteSourceOnDelete:
                    draftIngestMode === "copy"
                        ? draftDeleteSourceOnDelete
                        : false,
                enabled: draftEnabled,
            });
            liveConfig = data.config;
            settingsOpen = false;
            directoryBrowserOpen = false;
            toast("Sync settings saved");
        } catch (error) {
            console.error(error);
            toast("Failed to save sync settings");
        } finally {
            savingSettings = false;
        }
    }

    async function handleSyncNow() {
        syncingNow = true;
        try {
            await syncLiveImages();
            await loadCollections(1, false);
            page = 1;
            toast("Synced");
        } catch (error) {
            console.error(error);
            toast("Sync failed");
        } finally {
            syncingNow = false;
        }
    }

    const handleScroll = () => {
        const hasNext = page < lastPage;
        const isBottom =
            window.innerHeight + window.scrollY >=
            document.body.offsetHeight - 100;

        if (!hasNext || !isBottom || loadingMore) {
            return;
        }

        loadingMore = true;
        page += 1;

        loadCollections(page, true)
            .catch(() => {
                page -= 1;
            })
            .finally(() => {
                loadingMore = false;
            });
    };

    onMount(() => {
        pathStore.set({ collection: "/collection" });

        void loadCollections(1, false);
        void loadSyncConfig();

        document.addEventListener("scroll", handleScroll);

        socket = io();
        socket.on("live:status", (payload: Partial<LiveStatusResponse>) => {
            liveConfig = {
                watchDir: payload?.watchDir || liveConfig.watchDir,
                ingestMode:
                    payload?.ingestMode === "move" ? "move" : "copy",
                deleteSourceOnDelete: Boolean(payload?.deleteSourceOnDelete),
                enabled: Boolean(payload?.enabled),
                updatedAt: Number(payload?.updatedAt || Date.now()),
            };
        });
        socket.on("live:images", () => {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }

            refreshTimer = setTimeout(() => {
                page = 1;
                void loadCollections(1, false);
            }, 250);
        });
    });

    onDestroy(() => {
        document.removeEventListener("scroll", handleScroll);
        if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
        }
        socket?.disconnect();
        socket = null;
        memoCollections(collections);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toast("Copied to clipboard");
    };

    const handleDelete = async (collection: CollectionState) => {
        const success = await collection.delete();
        if (success) {
            collections = collections.filter(
                (c) => get(c).id !== get(collection).id,
            );
        }
    };

    const handleContextMenu = (e: MouseEvent, collection: CollectionState) => {
        collection.contextMenu(e);
    };
</script>

<div class="container">
    <CollectionNav />

    <div class="sync-toolbar">
        <div class="sync-meta">
            <span class={"status " + (liveConfig.enabled ? "on" : "off")}>
                {liveConfig.enabled ? "Realtime On" : "Realtime Off"}
            </span>
            <span>mode: {liveConfig.ingestMode}</span>
            <span>watch: {liveConfig.watchDir || "-"}</span>
        </div>
        <div class="sync-actions">
            <button class="secondary-button" on:click={handleSyncNow} disabled={syncingNow}>
                {syncingNow ? "Syncing..." : "Sync now"}
            </button>
            <button class="primary-button" on:click={openSettingsModal}>
                Realtime Settings
            </button>
        </div>
    </div>

    <div class="collection">
        {#each $resolveCollections as collection}
            <CollectionCard
                title={collection.title}
                image={collection.image}
                prompt={collection.prompt}
                negativePrompt={collection.negativePrompt}
                onClickCopy={handleCopyText}
                onClickDelete={() => handleDelete(collection)}
                onContextMenu={(e) => handleContextMenu(e, collection)}
            />
        {/each}
    </div>
</div>

{#if settingsOpen}
    <div
        class="sync-modal-backdrop"
        role="button"
        tabindex="0"
        on:click|self={closeSettingsModal}
        on:keydown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                closeSettingsModal();
            }
        }}
    >
        <div class="sync-modal" role="dialog" aria-modal="true" aria-label="Realtime Sync Settings">
            <h3>Realtime Sync Settings</h3>

            <label>
                Watch Directory
                <div class="row">
                    <input
                        type="text"
                        bind:value={draftWatchDir}
                        placeholder="C:\\path\\to\\watch"
                    />
                    <button class="secondary-button" on:click={openDirectoryBrowser}>
                        Browse Server
                    </button>
                </div>
            </label>

            <label class="option">
                <input
                    type="radio"
                    name="sync-mode"
                    value="copy"
                    bind:group={draftIngestMode}
                />
                Copy files to library (safe default)
            </label>
            <label class="option">
                <input
                    type="radio"
                    name="sync-mode"
                    value="move"
                    bind:group={draftIngestMode}
                />
                Move files to library
            </label>

            <label class="option">
                <input
                    type="checkbox"
                    bind:checked={draftDeleteSourceOnDelete}
                    disabled={draftIngestMode !== "copy"}
                />
                Also delete source file when deleting from collection
            </label>

            <label class="option">
                <input type="checkbox" bind:checked={draftEnabled} />
                Enable realtime watch mode
            </label>

            <div class="actions">
                <button class="secondary-button" on:click={closeSettingsModal}>
                    Cancel
                </button>
                <button class="primary-button" on:click={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    </div>
{/if}

{#if directoryBrowserOpen}
    <div
        class="sync-modal-backdrop"
        role="button"
        tabindex="0"
        on:click|self={closeDirectoryBrowser}
        on:keydown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                closeDirectoryBrowser();
            }
        }}
    >
        <div class="sync-modal directory-modal" role="dialog" aria-modal="true" aria-label="Server Directory Browser">
            <h3>Server Directory Browser</h3>

            <div class="path-line">
                {directoryCurrentPath || "-"}
            </div>

            {#if directoryRoots.length > 0}
                <div class="roots">
                    {#each directoryRoots as rootPath}
                        <button
                            class="secondary-button mini"
                            on:click={() => browseRootDirectory(rootPath)}
                            disabled={directoryBrowserLoading || directoryCurrentPath === rootPath}
                        >
                            {rootPath}
                        </button>
                    {/each}
                </div>
            {/if}

            <div class="dir-tools">
                <button
                    class="secondary-button"
                    on:click={browseParentDirectory}
                    disabled={!directoryParentPath || directoryBrowserLoading}
                >
                    Up
                </button>
                <button
                    class="secondary-button"
                    on:click={() => void loadServerDirectories(directoryCurrentPath || undefined)}
                    disabled={directoryBrowserLoading}
                >
                    Refresh
                </button>
            </div>

            <div class="dir-list">
                {#if directoryBrowserLoading}
                    <div class="dir-item empty">Loading...</div>
                {:else if directoryEntries.length === 0}
                    <div class="dir-item empty">No subdirectories</div>
                {:else}
                    {#each directoryEntries as entry}
                        <button class="dir-item" on:click={() => browseChildDirectory(entry)}>
                            {entry.name}
                        </button>
                    {/each}
                {/if}
            </div>

            <div class="actions">
                <button class="secondary-button" on:click={closeDirectoryBrowser}>
                    Close
                </button>
                <button
                    class="primary-button"
                    on:click={applySelectedDirectory}
                    disabled={!directoryCurrentPath}
                >
                    Use This Path
                </button>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .sync-toolbar {
        margin-bottom: 1rem;
        padding: 0.75rem;
        border: 1px solid #b6b6b6;
        border-radius: 0.5rem;
        background-color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .sync-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        span {
            border: 1px solid #ccc;
            border-radius: 999px;
            padding: 0.2rem 0.65rem;
            font-size: 0.75rem;
            background: #f7f7f7;
        }

        .status.on {
            border-color: #0a8d5d;
            color: #0a8d5d;
        }

        .status.off {
            border-color: #b9274b;
            color: #b9274b;
        }
    }

    .sync-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .sync-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99;
        padding: 1rem;
    }

    .sync-modal {
        width: min(640px, 100%);
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #ccc;
        padding: 1rem;
        display: grid;
        gap: 0.7rem;

        h3 {
            margin: 0;
        }

        label {
            display: grid;
            gap: 0.35rem;
            font-size: 0.85rem;
            font-weight: 700;

            input[type="text"] {
                width: 100%;
                border: 1px solid #bbb;
                border-radius: 0.45rem;
                padding: 0.5rem 0.6rem;
                outline: none;
            }
        }

        .row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0.5rem;
        }

        .option {
            display: flex;
            align-items: center;
            gap: 0.45rem;
            font-size: 0.82rem;
            font-weight: 600;
        }

        .actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }
    }

    .directory-modal {
        width: min(760px, 100%);
        max-height: min(85vh, 920px);
    }

    .path-line {
        font-size: 0.8rem;
        background: #f4f5f8;
        border: 1px solid #d5d8df;
        border-radius: 0.4rem;
        padding: 0.5rem 0.6rem;
        word-break: break-all;
    }

    .roots {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    .secondary-button.mini {
        font-size: 0.72rem;
        padding: 0.2rem 0.45rem;
    }

    .dir-tools {
        display: flex;
        gap: 0.4rem;
    }

    .dir-list {
        border: 1px solid #d7d7d7;
        border-radius: 0.45rem;
        min-height: 220px;
        max-height: min(48vh, 520px);
        overflow: auto;
        display: grid;
        gap: 0.35rem;
        padding: 0.45rem;
        background: #fbfbfb;
    }

    .dir-item {
        border: 1px solid #d0d0d0;
        border-radius: 0.35rem;
        text-align: left;
        padding: 0.45rem 0.55rem;
        background: #fff;
        cursor: pointer;
        font-size: 0.8rem;

        &:hover {
            border-color: #6a7aa8;
            background: #f5f8ff;
        }
    }

    .dir-item.empty {
        cursor: default;
        border-style: dashed;
        color: #666;
        text-align: center;
    }
</style>
