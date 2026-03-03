import { liveImagesService } from './live-images';

interface LiveImagesServiceQueueAccess {
    imageMutationQueue: Promise<void>;
    enqueueImageMutation: <T>(task: () => Promise<T>) => Promise<T>;
}

describe('live-images mutation queue', () => {
    const service = liveImagesService as unknown as LiveImagesServiceQueueAccess;

    beforeEach(() => {
        service.imageMutationQueue = Promise.resolve();
    });

    afterEach(() => {
        service.imageMutationQueue = Promise.resolve();
    });

    it('resolves nested queued mutations without deadlock', async () => {
        const nestedTask = service.enqueueImageMutation(async () => {
            await service.enqueueImageMutation(async () => undefined);
            return 'ok';
        });

        const timeout = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('queue deadlock timeout')), 300);
        });

        await expect(Promise.race([nestedTask, timeout])).resolves.toBe('ok');
    });
});
