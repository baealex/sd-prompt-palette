import fs from 'fs';
import childProcess from 'child_process';
import path from 'path';

const prismaPath = path.resolve(__dirname, '../prisma');
const packageRootPath = path.resolve(__dirname, '..');
const workspaceRootPath = path.resolve(packageRootPath, '../..');

const createPrismaBinPath = (basePath: string) =>
    process.platform === 'win32'
        ? path.resolve(basePath, 'node_modules/.bin/prisma.CMD')
        : path.resolve(basePath, 'node_modules/.bin/prisma');

const prismaBinPathCandidates = [
    createPrismaBinPath(packageRootPath),
    createPrismaBinPath(workspaceRootPath),
];

const prismaBinPath =
    prismaBinPathCandidates.find((binPath) => fs.existsSync(binPath)) ??
    prismaBinPathCandidates[0];

const runPrisma = (command: string) => {
    childProcess.execSync(`"${prismaBinPath}" ${command}`, {
        cwd: packageRootPath,
        stdio: 'inherit',
    });
};

export const createDatabase = async () => {
    runPrisma('generate');
    runPrisma('migrate deploy');
};

export const removeDatabase = async (fileName = 'db.sqlite3') => {
    if (fs.existsSync(path.resolve(prismaPath, fileName))) {
        fs.unlinkSync(path.resolve(prismaPath, fileName));
    }
};
