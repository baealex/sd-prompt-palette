import fs from 'fs';
import childProcess from 'child_process';
import path from 'path';

const prismaPath = path.resolve(__dirname, '../prisma');
const packageRootPath = path.resolve(__dirname, '..');
const prismaBinPath = process.platform === 'win32'
    ? path.resolve(packageRootPath, 'node_modules/.bin/prisma.CMD')
    : path.resolve(packageRootPath, 'node_modules/.bin/prisma');

export const createDatabase = async () => {
    childProcess.execSync(`"${prismaBinPath}" migrate deploy`, {
        cwd: packageRootPath,
        stdio: 'inherit',
    });
};

export const removeDatabase = async (fileName = 'db.sqlite3') => {
    if (fs.existsSync(path.resolve(prismaPath, fileName))) {
        fs.unlinkSync(path.resolve(prismaPath, fileName));
    }
};
