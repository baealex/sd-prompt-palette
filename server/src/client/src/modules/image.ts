export async function imageToBase64(file): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

interface ReadPromptInfoCallback {
    onError?: (error: string) => void;
    onSuccess?: (promptInfo: { prompt: string, negativePrompt: string }) => void;
}

export function readPromptInfo(data: string, callback: ReadPromptInfoCallback) {
    const [_, base64] = data.split(',');
    const decodedData = atob(base64);

    if (!decodedData.includes('parameters') || !decodedData.includes('Steps:')) {
        callback.onError?.('Cannot read prompt info');
        return;
    }

    const promptInfo = decodedData
        .split('parameters')[1]
        .split('Steps:')[0]
        .slice(1, -1);
    const [
        prompt,
        negativePrompt
    ] = promptInfo.split('Negative prompt:').map((v) => v.trim());
    callback.onSuccess?.({ prompt, negativePrompt });
}