import fs from 'fs';
import os from 'os';
import path from 'path';

import { walkWatchImageFiles } from './live-images.watch-paths';

async function writeFile(targetPath: string): Promise<void> {
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, 'x');
}

describe('live-images.watch-paths business logic', () => {
    let tempDirPath = '';

    beforeEach(async () => {
        tempDirPath = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'ocean-palette-watch-paths-'),
        );
    });

    afterEach(async () => {
        await fs.promises.rm(tempDirPath, { recursive: true, force: true });
    });

    it('walks nested folders and sorts by directory plus filename', async () => {
        // Arrange
        const watchDirPath = path.resolve(tempDirPath, 'watch');
        const imageBaseDirPath = path.resolve(watchDirPath, 'library');

        await writeFile(path.resolve(watchDirPath, 'zeta.png'));
        await writeFile(path.resolve(watchDirPath, 'a', '10.png'));
        await writeFile(path.resolve(watchDirPath, 'a', '2.png'));
        await writeFile(path.resolve(watchDirPath, 'a', 'sub', '1.jpg'));
        await writeFile(path.resolve(watchDirPath, 'b', '01.webp'));
        await writeFile(path.resolve(watchDirPath, 'node_modules', 'skip.png'));
        await writeFile(path.resolve(watchDirPath, '.git', 'skip.jpg'));
        await writeFile(path.resolve(watchDirPath, 'a', 'note.txt'));
        await writeFile(path.resolve(imageBaseDirPath, 'ignored.png'));

        // Act
        const files = await walkWatchImageFiles({
            watchDirPath,
            imageBaseDirPath,
        });

        // Assert
        expect(files).toEqual([
            path.resolve(watchDirPath, 'a', '2.png'),
            path.resolve(watchDirPath, 'a', '10.png'),
            path.resolve(watchDirPath, 'a', 'sub', '1.jpg'),
            path.resolve(watchDirPath, 'b', '01.webp'),
            path.resolve(watchDirPath, 'zeta.png'),
        ]);
    });
});
