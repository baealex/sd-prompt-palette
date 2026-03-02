import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

interface UseHomeSampleImageActionsOptions {
    addKeywordSampleImage: (
        keywordId: number,
        imageFile: File,
    ) => Promise<boolean>;
    removeKeywordSampleImage: (keywordId: number) => Promise<boolean>;
    onSuccessToast: (message: string) => void;
}

export const useHomeSampleImageActions = ({
    addKeywordSampleImage,
    removeKeywordSampleImage,
    onSuccessToast,
}: UseHomeSampleImageActionsOptions) => {
    const [pendingKeywordIdForImage, setPendingKeywordIdForImage] = useState<
        number | null
    >(null);
    const sampleImageInputRef = useRef<HTMLInputElement | null>(null);

    const handleAddKeywordSampleImageRequest = useCallback((keywordId: number) => {
        setPendingKeywordIdForImage(keywordId);
        sampleImageInputRef.current?.click();
    }, []);

    const handleSampleImageChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const imageFile = event.target.files?.[0];
            if (!imageFile || !pendingKeywordIdForImage) {
                setPendingKeywordIdForImage(null);
                event.target.value = '';
                return;
            }

            void (async () => {
                const added = await addKeywordSampleImage(
                    pendingKeywordIdForImage,
                    imageFile,
                );
                if (added) {
                    onSuccessToast('Sample image added');
                }
            })();
            setPendingKeywordIdForImage(null);
            event.target.value = '';
        },
        [addKeywordSampleImage, onSuccessToast, pendingKeywordIdForImage],
    );

    const handleRemoveKeywordSampleImage = useCallback(
        (keywordId: number) => {
            void (async () => {
                const removed = await removeKeywordSampleImage(keywordId);
                if (removed) {
                    onSuccessToast('Sample image removed');
                }
            })();
        },
        [onSuccessToast, removeKeywordSampleImage],
    );

    return {
        sampleImageInputRef,
        handleAddKeywordSampleImageRequest,
        handleSampleImageChange,
        handleRemoveKeywordSampleImage,
    };
};
