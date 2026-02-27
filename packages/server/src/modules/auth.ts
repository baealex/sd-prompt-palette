import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;
const BCRYPT_SALT_ROUNDS = 10;

type BcryptLike = {
    hash: (password: string, saltOrRounds: string | number) => Promise<string>;
};

let bcryptModulePromise: Promise<BcryptLike | null> | null = null;

async function loadBcryptModule(): Promise<BcryptLike | null> {
    try {
        const imported = await import('bcrypt');
        const candidate = (imported as any).default || imported;
        if (candidate && typeof candidate.hash === 'function') {
            return candidate as BcryptLike;
        }
    } catch {
        // fallback to scrypt
    }

    return null;
}

async function getBcryptModule(): Promise<BcryptLike | null> {
    if (!bcryptModulePromise) {
        bcryptModulePromise = loadBcryptModule();
    }
    return bcryptModulePromise;
}

async function createScryptHash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
    return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

export const createPasswordHash = async (password: string) => {
    const bcrypt = await getBcryptModule();
    if (bcrypt) {
        return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }

    return createScryptHash(password);
};
