import { scrypt as scryptCallback, randomBytes } from 'crypto';
import { promisify } from 'util';

import {
    createPasswordHash,
    getPasswordHashAlgorithm,
    verifyPasswordHash,
} from './auth';

const scrypt = promisify(scryptCallback);

describe('auth password service', () => {
    it('hashes and verifies password through a single service entrypoint', async () => {
        // Arrange
        const plainPassword = 'my-secret-password';

        // Act
        const storedHash = await createPasswordHash(plainPassword);
        const matches = await verifyPasswordHash(plainPassword, storedHash);
        const mismatches = await verifyPasswordHash('wrong-password', storedHash);

        // Assert
        expect(storedHash).toBeTruthy();
        expect(matches).toBe(true);
        expect(mismatches).toBe(false);
    });

    it('returns false for unsupported hash formats', async () => {
        // Arrange
        const plainPassword = 'pw';
        const invalidHash = 'plain-text-hash';

        // Act
        const verified = await verifyPasswordHash(plainPassword, invalidHash);

        // Assert
        expect(verified).toBe(false);
    });

    it('supports legacy scrypt formatted hashes regardless of preferred hasher', async () => {
        // Arrange
        const plainPassword = 'legacy-password';
        const salt = randomBytes(16);
        const key = (await scrypt(plainPassword, salt, 64)) as Buffer;
        const scryptHash = `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;

        // Act
        const matches = await verifyPasswordHash(plainPassword, scryptHash);
        const mismatches = await verifyPasswordHash('not-legacy-password', scryptHash);

        // Assert
        expect(matches).toBe(true);
        expect(mismatches).toBe(false);
    });

    it('exposes currently selected default hash algorithm', async () => {
        // Arrange
        const supportedAlgorithms = new Set(['bcrypt', 'scrypt']);

        // Act
        const algorithm = await getPasswordHashAlgorithm();

        // Assert
        expect(supportedAlgorithms.has(algorithm)).toBe(true);
    });
});
