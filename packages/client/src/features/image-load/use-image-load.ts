import { useState } from 'react';

import {
    createCollection,
    imageUpload,
    parseImageMetadata,
    type ImageUploadResponse,
    type ParsedImageMetadataResponse,
} from '~/api';
import { imageToBase64 } from '~/modules/image';

type ParsedPrompt = ParsedImageMetadataResponse['metadata'];
type UploadedImage = ImageUploadResponse;

export const useImageLoad = () => {
    const [base64, setBase64] = useState<string | null>(null);
    const [parsedPrompt, setParsedPrompt] = useState<ParsedPrompt | null>(null);
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [selectedFileModifiedAt, setSelectedFileModifiedAt] = useState<string | null>(null);
    const [savedCollectionId, setSavedCollectionId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const clearLoadedState = () => {
        setBase64(null);
        setParsedPrompt(null);
        setUploadedImage(null);
        setSelectedFileModifiedAt(null);
        setSavedCollectionId(null);
    };

    const onFile = async (file: File | null) => {
        if (!file) {
            clearLoadedState();
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        setUploadedImage(null);
        setSelectedFileModifiedAt(Number.isFinite(file.lastModified) ? new Date(file.lastModified).toISOString() : null);
        setSavedCollectionId(null);

        try {
            const data = await imageToBase64(file);
            setBase64(data);
            const metadataResponse = await parseImageMetadata({ image: data });
            if (!metadataResponse.data.ok) {
                throw new Error('Cannot read prompt info');
            }
            setParsedPrompt(metadataResponse.data.metadata);
            setError(null);
        } catch (uploadError) {
            clearLoadedState();
            setError(uploadError instanceof Error ? uploadError.message : 'Failed to read image');
        } finally {
            setLoading(false);
        }
    };

    const saveToCollection = async (title: string) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError('Collection title is required');
            return;
        }
        if (!base64) {
            setError('Please load an image first');
            return;
        }
        if (!parsedPrompt || (!parsedPrompt.prompt && !parsedPrompt.negativePrompt)) {
            setError('Please load an SD image with prompt metadata first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const image = uploadedImage ?? (await imageUpload({ image: base64 })).data;
            setUploadedImage(image);

            const createdCollection = await createCollection({
                imageId: image.id,
                title: trimmedTitle,
                prompt: parsedPrompt.prompt || '',
                negativePrompt: parsedPrompt.negativePrompt || '',
            });

            setSavedCollectionId(createdCollection.data.createCollection.id);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save collection');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        parsedPrompt,
        uploadedImage,
        selectedFileModifiedAt,
        savedCollectionId,
        onFile,
        saveToCollection,
    };
};
