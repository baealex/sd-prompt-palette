import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ALLOWLIST = new Set([
    'packages/client/src/components/domain/Checkbox.tsx',
]);

const RAW_CONTROL_PATTERN = /<button\b|<input\b/g;
const NATIVE_DIALOG_PATTERN = /window\.(alert|prompt|confirm)\s*\(/g;

const files = process.argv.slice(2).filter(Boolean);

if (files.length === 0) {
    console.log('[guard:ui-contract] No staged files to check.');
    process.exit(0);
}

const shouldCheckUiContract = (filePath) => {
    return /^packages\/client\/src\/(components\/domain|pages)\/.+\.(ts|tsx)$/.test(filePath);
};

const findLineNumbers = (source, regex) => {
    const lines = source.split(/\r?\n/);
    const hits = [];
    for (let index = 0; index < lines.length; index += 1) {
        if (regex.test(lines[index])) {
            hits.push(index + 1);
        }
        regex.lastIndex = 0;
    }
    return hits;
};

const violations = [];

for (const filePath of files) {
    if (!shouldCheckUiContract(filePath)) {
        continue;
    }
    if (ALLOWLIST.has(filePath)) {
        continue;
    }

    const source = readFileSync(resolve(filePath), 'utf8');
    const allowRaw = source.includes('guardrail: allow-raw');

    if (!allowRaw) {
        const rawLineNumbers = findLineNumbers(source, RAW_CONTROL_PATTERN);
        if (rawLineNumbers.length > 0) {
            violations.push({
                filePath,
                lines: rawLineNumbers,
                message: 'Use atomic UI components instead of raw <button>/<input>.',
            });
        }
    }

    const dialogLineNumbers = findLineNumbers(source, NATIVE_DIALOG_PATTERN);
    if (dialogLineNumbers.length > 0) {
        violations.push({
            filePath,
            lines: dialogLineNumbers,
            message: 'window.alert/prompt/confirm is forbidden. Use dialog components.',
        });
    }
}

if (violations.length > 0) {
    console.error('[guard:ui-contract] Commit blocked.');
    for (const violation of violations) {
        console.error(`- ${violation.filePath}:${violation.lines.join(', ')} ${violation.message}`);
    }
    console.error('If raw control is intentionally required, add "guardrail: allow-raw" with a reason.');
    process.exit(1);
}

console.log('[guard:ui-contract] Passed.');

