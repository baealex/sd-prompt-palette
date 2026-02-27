import { useState } from 'react';

import { imageUpload } from '~/api';
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

export function useImageLoad() {
    const [base64, setBase64] = useState<string | null>(null);
    const [parsedPrompt, setParsedPrompt] = useState<ParsedPrompt | null>(null);
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const parsePrompt = (value: string) => {
        readPromptInfo(value, {
            onSuccess: (promptInfo) => {
                setParsedPrompt(promptInfo);
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
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        parsedPrompt,
        uploadedImage,
        onFile,
        upload,
    };
}
