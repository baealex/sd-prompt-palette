import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

const files = process.argv.slice(2).filter(Boolean);

if (files.length === 0) {
    console.log('[guard:agent-rules] No staged files to check.');
    process.exit(0);
}

const normalizePath = (filePath) => filePath.replaceAll('\\', '/');

const stagedFiles = files.map(normalizePath);
const stagedSet = new Set(stagedFiles);
const violations = [];

const readJsonFromGit = (revisionAndPath) => {
    const result = spawnSync('git', ['show', revisionAndPath], { encoding: 'utf8' });
    if (result.status !== 0) {
        return null;
    }
    try {
        return JSON.parse(result.stdout);
    } catch {
        return null;
    }
};

const normalizeDependencies = (packageJson) => {
    const normalized = {};
    for (const field of DEPENDENCY_FIELDS) {
        const value = packageJson?.[field];
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            continue;
        }
        normalized[field] = Object.fromEntries(
            Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
        );
    }
    return normalized;
};

const hasDependencyChange = (packageJsonPath) => {
    const stagedContent = readJsonFromGit(`:${packageJsonPath}`);
    if (!stagedContent) {
        return false;
    }

    const previousContent = readJsonFromGit(`HEAD:${packageJsonPath}`);
    const currentDeps = normalizeDependencies(stagedContent);
    const previousDeps = normalizeDependencies(previousContent ?? {});
    return JSON.stringify(currentDeps) !== JSON.stringify(previousDeps);
};

const hasStagedLockfile = (packageJsonPath) => {
    const packageDir = normalizePath(dirname(packageJsonPath));
    const localLockfile = packageDir === '.' ? 'pnpm-lock.yaml' : `${packageDir}/pnpm-lock.yaml`;
    const candidates = [];

    if (existsSync(resolve(localLockfile))) {
        candidates.push(localLockfile);
    }
    if (localLockfile !== 'pnpm-lock.yaml' && existsSync(resolve('pnpm-lock.yaml'))) {
        candidates.push('pnpm-lock.yaml');
    }

    return candidates.some((lockfilePath) => stagedSet.has(lockfilePath));
};

for (const filePath of stagedFiles) {
    if (!filePath.endsWith('/package.json') && filePath !== 'package.json') {
        continue;
    }

    if (!hasDependencyChange(filePath)) {
        continue;
    }

    if (hasStagedLockfile(filePath)) {
        continue;
    }

    violations.push({
        filePath,
        message: 'Dependency fields changed without staged lockfile update.',
    });
}

if (violations.length > 0) {
    console.error('[guard:agent-rules] Commit blocked.');
    for (const violation of violations) {
        console.error(`- ${violation.filePath} ${violation.message}`);
    }
    process.exit(1);
}

console.log('[guard:agent-rules] Passed.');
