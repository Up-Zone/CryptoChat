/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
modified by upzone May 2017
*/
(function() {
    // Shortcuts
    const C = CryptoJS;
    const C_lib = C.lib;
    const Base = C_lib.Base;
    var WordArray = C_lib.WordArray;
    const C_algo = C.algo;
    const SHA1 = C_algo.SHA1;
    var HMAC = C_algo.HMAC;
    /**
     * Password-Based Key Derivation Function 2 algorithm.
     */
    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
        /**
         * Configuration options.
         *
         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
         * @property {Hasher} hasher The hasher to use. Default: SHA1
         * @property {number} iterations The number of iterations to perform. Default: 1
         */
        cfg: Base.extend({
            keySize: 128 / 32,
            hasher: SHA1,
            iterations: 1
        }),
        /**
         * Initializes a newly created key derivation function.
         *
         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
         *
         * @example
         *
         *     var kdf = CryptoJS.algo.PBKDF2.create();
         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
         */
        init: function(cfg, statusCallback) {
            this.cfg = this.cfg.extend(cfg);
            this.statusCallback = statusCallback;
        },
        /**
         * Computes the Password-Based Key Derivation Function 2.
         *
         * @param {WordArray|string} password The password.
         * @param {WordArray|string} salt A salt.
         *
         * @return {WordArray} The derived key.
         *
         * @example
         *
         *     var key = kdf.compute(password, salt);
         */
        compute: function(password, salt) {
            // Shortcut
            const cfg = this.cfg;
            const statusCallback = this.statusCallback;
            // Init HMAC
            const hmac = HMAC.create(cfg.hasher, password);
            // Initial values
            const derivedKey = WordArray.create();
            const blockIndex = WordArray.create([0x00000001]);
            // Shortcuts
            const derivedKeyWords = derivedKey.words;
            const blockIndexWords = blockIndex.words;
            const keySize = cfg.keySize;
            const iterations = cfg.iterations;
            // Generate key
            var keySizeCeiled = null;
            var percentageSteps = null;
            var percentageDone = null;
            while (derivedKeyWords.length < keySize) {
                const block = hmac.update(salt).finalize(blockIndex);
                hmac.reset();
                // Shortcuts
                const blockWords = block.words;
                const blockWordsLength = blockWords.length;
                // percentage calculation for status callback
                if (null == keySizeCeiled) {
                    keySizeCeiled = keySize + (blockWordsLength - (keySize % blockWordsLength));
                    percentageSteps = 100 / (keySizeCeiled / blockWordsLength);
                }
                percentageDone = derivedKeyWords.length * 100 / keySizeCeiled;
                statusCallback(percentageDone);
                // Iterations
                let intermediate = block;
                for (let i = 1; i < iterations; i++) {
                    intermediate = hmac.finalize(intermediate);
                    hmac.reset();
                    // Shortcut
                    const intermediateWords = intermediate.words;
                    // XOR intermediate with block
                    for (let j = 0; j < blockWordsLength; j++) {
                        blockWords[j] ^= intermediateWords[j];
                    }
                    if (i % 64 === 0) {
                        statusCallback(percentageDone + (percentageSteps * (i / iterations)));
                    }
                }
                derivedKey.concat(block);
                blockIndexWords[0]++;
            }
            derivedKey.sigBytes = keySize * 4;
            statusCallback(100.0); // done
            return derivedKey;
        }
    });
    /**
     * Computes the Password-Based Key Derivation Function 2.
     *
     * @param {WordArray|string} password The password.
     * @param {WordArray|string} salt A salt.
     * @param {Object} cfg (Optional) The configuration options to use for this computation.
     *
     * @return {WordArray} The derived key.
     *
     * @static
     *
     * @example
     *
     *     var key = CryptoJS.PBKDF2(password, salt);
     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
     */
    C.PBKDF2 = function(password, salt, cfg, statusCallback) {
        return PBKDF2.create(cfg, statusCallback).compute(password, salt);
    };
}());