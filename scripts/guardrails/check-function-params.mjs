import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const requireFromServer = createRequire(
    resolve('packages/server/package.json'),
);
const ts = requireFromServer('typescript');

const files = process.argv
    .slice(2)
    .filter(Boolean)
    .map((filePath) => filePath.replaceAll('\\', '/'));

if (files.length === 0) {
    console.log('[guard:function-params] No staged files to check.');
    process.exit(0);
}

const TARGET_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.mts',
    '.cts',
]);

const targetFiles = files.filter((filePath) =>
    TARGET_EXTENSIONS.has(extname(filePath).toLowerCase()),
);

if (targetFiles.length === 0) {
    console.log('[guard:function-params] No target files to check.');
    process.exit(0);
}

const parseChangedLineSet = (filePath) => {
    const diffResult = spawnSync(
        'git',
        ['diff', '--cached', '--unified=0', '--', filePath],
        { encoding: 'utf8' },
    );
    if (diffResult.status !== 0) {
        return null;
    }

    const changedLines = new Set();
    const lines = diffResult.stdout.split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
        if (!match) {
            continue;
        }

        const start = Number.parseInt(match[1], 10);
        const count = Number.parseInt(match[2] || '1', 10);
        for (let offset = 0; offset < count; offset += 1) {
            changedLines.add(start + offset);
        }
    }

    return changedLines;
};

const getScriptKind = (filePath) => {
    const extension = extname(filePath).toLowerCase();
    if (extension === '.tsx') {
        return ts.ScriptKind.TSX;
    }
    if (extension === '.jsx') {
        return ts.ScriptKind.JSX;
    }
    if (extension === '.js') {
        return ts.ScriptKind.JS;
    }
    if (extension === '.mjs') {
        return ts.ScriptKind.JS;
    }
    if (extension === '.cjs') {
        return ts.ScriptKind.JS;
    }
    return ts.ScriptKind.TS;
};

const isTargetFunctionNode = (node) => {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        return true;
    }

    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        const parent = node.parent;
        return (
            ts.isVariableDeclaration(parent) ||
            ts.isPropertyDeclaration(parent) ||
            ts.isPropertyAssignment(parent)
        );
    }

    return false;
};

const countParameters = (node) =>
    node.parameters.filter((parameter) => !ts.isIdentifier(parameter.name) || parameter.name.text !== 'this')
        .length;

const hasChangedLineInRange = ({
    changedLines,
    startLine,
    endLine,
}) => {
    for (let line = startLine; line <= endLine; line += 1) {
        if (changedLines.has(line)) {
            return true;
        }
    }
    return false;
};

const resolveFunctionName = (node) => {
    if (node.name && ts.isIdentifier(node.name)) {
        return node.name.text;
    }

    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }
    if (ts.isPropertyDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }

    return '<anonymous>';
};

const violations = [];

for (const filePath of targetFiles) {
    const changedLines = parseChangedLineSet(filePath);
    if (!changedLines || changedLines.size === 0) {
        continue;
    }

    const source = readFileSync(resolve(filePath), 'utf8');
    const sourceFile = ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.Latest,
        true,
        getScriptKind(filePath),
    );

    const visit = (node) => {
        if (isTargetFunctionNode(node)) {
            const parameterCount = countParameters(node);
            if (parameterCount >= 3) {
                const start = sourceFile.getLineAndCharacterOfPosition(
                    node.getStart(sourceFile),
                );
                const end = sourceFile.getLineAndCharacterOfPosition(
                    node.end,
                );
                const startLine = start.line + 1;
                const endLine = end.line + 1;

                if (
                    hasChangedLineInRange({
                        changedLines,
                        startLine,
                        endLine,
                    })
                ) {
                    violations.push({
                        filePath,
                        line: startLine,
                        name: resolveFunctionName(node),
                        parameterCount,
                    });
                }
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
}

if (violations.length > 0) {
    console.error('[guard:function-params] Commit blocked.');
    for (const violation of violations) {
        console.error(
            `- ${violation.filePath}:${violation.line} ${violation.name} has ${violation.parameterCount} params. Use a single object parameter for 3+ args.`,
        );
    }
    process.exit(1);
}

console.log('[guard:function-params] Passed.');
