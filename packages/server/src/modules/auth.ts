import {
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const SCRYPT_PREFIX = 'scrypt';
const SCRYPT_SEPARATOR = '$';
const SCRYPT_SALT_LENGTH = 16;
const SCRYPT_HASH_LENGTH = 64;
const BCRYPT_SALT_ROUNDS = 10;
const BCRYPT_HASH_PATTERN = /^\$2[abxy]\$\d{2}\$.+/;

type BcryptLike = {
    hash: (password: string, saltOrRounds: string | number) => Promise<string>;
    compare: (password: string, hash: string) => Promise<boolean>;
};

type PasswordAlgorithm = 'bcrypt' | 'scrypt';

type PasswordHasher = {
    algorithm: PasswordAlgorithm;
    hash: (password: string) => Promise<string>;
    verify: (password: string, storedHash: string) => Promise<boolean>;
    supports: (storedHash: string) => boolean;
};

type PasswordService = {
    algorithm: PasswordAlgorithm;
    hash: (password: string) => Promise<string>;
    verify: (password: string, storedHash: string) => Promise<boolean>;
};

let passwordServicePromise: Promise<PasswordService> | null = null;

function isBcryptLike(candidate: unknown): candidate is BcryptLike {
    if (!candidate || typeof candidate !== 'object') {
        return false;
    }

    const value = candidate as {
        hash?: unknown;
        compare?: unknown;
    };
    return typeof value.hash === 'function' && typeof value.compare === 'function';
}

function readDefaultExport(candidate: unknown): unknown {
    if (!candidate || typeof candidate !== 'object') {
        return candidate;
    }

    if (!('default' in candidate)) {
        return candidate;
    }

    return (candidate as { default?: unknown }).default;
}

async function loadBcryptModule(): Promise<BcryptLike | null> {
    try {
        const imported = await import('bcrypt');
        const candidate = readDefaultExport(imported);
        if (isBcryptLike(candidate)) {
            return candidate;
        }
    } catch {
        // fallback to scrypt
    }

    return null;
}

function isHexString(value: string): boolean {
    return /^[0-9a-f]+$/i.test(value);
}

function parseScryptHash(storedHash: string): { salt: Buffer; key: Buffer } | null {
    const parts = storedHash.split(SCRYPT_SEPARATOR);
    if (parts.length !== 3) {
        return null;
    }

    const [prefix, saltHex, keyHex] = parts;
    if (prefix !== SCRYPT_PREFIX || !saltHex || !keyHex) {
        return null;
    }

    if (!isHexString(saltHex) || !isHexString(keyHex)) {
        return null;
    }

    if (saltHex.length % 2 !== 0 || keyHex.length % 2 !== 0) {
        return null;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const key = Buffer.from(keyHex, 'hex');
    if (salt.length === 0 || key.length === 0) {
        return null;
    }

    return { salt, key };
}

function createScryptHasher(): PasswordHasher {
    return {
        algorithm: 'scrypt',
        async hash(password: string): Promise<string> {
            const salt = randomBytes(SCRYPT_SALT_LENGTH);
            const derivedKey = (await scrypt(password, salt, SCRYPT_HASH_LENGTH)) as Buffer;
            return `${SCRYPT_PREFIX}${SCRYPT_SEPARATOR}${salt.toString('hex')}${SCRYPT_SEPARATOR}${derivedKey.toString('hex')}`;
        },
        async verify(password: string, storedHash: string): Promise<boolean> {
            const parsed = parseScryptHash(storedHash);
            if (!parsed) {
                return false;
            }

            const derivedKey = (await scrypt(password, parsed.salt, parsed.key.length)) as Buffer;
            if (derivedKey.length !== parsed.key.length) {
                return false;
            }

            return timingSafeEqual(derivedKey, parsed.key);
        },
        supports(storedHash: string): boolean {
            return storedHash.startsWith(`${SCRYPT_PREFIX}${SCRYPT_SEPARATOR}`);
        },
    };
}

function createBcryptHasher(bcrypt: BcryptLike): PasswordHasher {
    return {
        algorithm: 'bcrypt',
        async hash(password: string): Promise<string> {
            return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        },
        async verify(password: string, storedHash: string): Promise<boolean> {
            return bcrypt.compare(password, storedHash);
        },
        supports(storedHash: string): boolean {
            return BCRYPT_HASH_PATTERN.test(storedHash);
        },
    };
}

async function createPasswordService(): Promise<PasswordService> {
    const scryptHasher = createScryptHasher();
    const bcryptModule = await loadBcryptModule();
    const hashers: PasswordHasher[] = bcryptModule
        ? [createBcryptHasher(bcryptModule), scryptHasher]
        : [scryptHasher];

    const preferredHasher = hashers[0];
    return {
        algorithm: preferredHasher.algorithm,
        hash(password: string): Promise<string> {
            return preferredHasher.hash(password);
        },
        async verify(password: string, storedHash: string): Promise<boolean> {
            const hasher = hashers.find((candidate) => candidate.supports(storedHash));
            if (!hasher) {
                return false;
            }

            return hasher.verify(password, storedHash);
        },
    };
}

async function getPasswordService(): Promise<PasswordService> {
    if (!passwordServicePromise) {
        passwordServicePromise = createPasswordService();
    }
    return passwordServicePromise;
}

export const createPasswordHash = async (password: string) => {
    const passwordService = await getPasswordService();
    return passwordService.hash(password);
};

export const verifyPasswordHash = async (password: string, storedHash: string): Promise<boolean> => {
    const passwordService = await getPasswordService();
    return passwordService.verify(password, storedHash);
};

export const getPasswordHashAlgorithm = async (): Promise<PasswordAlgorithm> => {
    const passwordService = await getPasswordService();
    return passwordService.algorithm;
};
