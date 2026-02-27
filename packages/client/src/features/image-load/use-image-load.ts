import { useState } from 'react';

import { createCollection, imageUpload } from '~/api';
import { imageToBase64, readPromptInfo } from '~/modules/image';

interface ParsedPrompt {
    prompt: string;
    negativePrompt: string;
}

interface UploadedImage {
    id: number;
    url: string;
    width: number;
    height: number;
}

const cleanPromptText = (text: string) => {
    return text
        .replace(/[\b]/g, '')
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .join(', ');
};

export const useImageLoad = () => {
    const [base64, setBase64] = useState<string | null>(null);
    const [parsedPrompt, setParsedPrompt] = useState<ParsedPrompt | null>(null);
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [savedCollectionId, setSavedCollectionId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const parsePrompt = (value: string) => {
        readPromptInfo(value, {
            onSuccess: (promptInfo) => {
                setParsedPrompt({
                    prompt: cleanPromptText(promptInfo.prompt),
                    negativePrompt: cleanPromptText(promptInfo.negativePrompt),
                });
                setError(null);
            },
            onError: (message) => {
                setParsedPrompt(null);
                setError(message);
            },
        });
    };

    const onFile = async (file: File | null) => {
        if (!file) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await imageToBase64(file);
            setBase64(data);
            setSavedCollectionId(null);
            parsePrompt(data);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Failed to read image');
        } finally {
            setLoading(false);
        }
    };

    const upload = async () => {
        if (!base64) {
            setError('No image selected');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await imageUpload({ image: base64 });
            setUploadedImage(response.data);
            setError(null);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
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
                prompt: cleanPromptText(parsedPrompt.prompt),
                negativePrompt: cleanPromptText(parsedPrompt.negativePrompt),
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
        savedCollectionId,
        onFile,
        upload,
        saveToCollection,
    };
};
