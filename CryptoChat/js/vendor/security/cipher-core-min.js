/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
CryptoJS.lib.Cipher ||
    function(u) {
        var g = CryptoJS;
        const f = g.lib;
        const k = f.Base;
        var l = f.WordArray,
            q = f.BufferedBlockAlgorithm,
            r = g.enc.Base64,
            v = g.algo.EvpKDF,
            n = f.Cipher = q.extend({
                cfg: k.extend(),
                createEncryptor: function(a, b) {
                    return this.create(this._ENC_XFORM_MODE, a, b);
                },
                createDecryptor: function(a, b) {
                    return this.create(this._DEC_XFORM_MODE, a, b);
                },
                init: function(a, b, c) {
                    this.cfg = this.cfg.extend(c);
                    this._xformMode = a;
                    this._key = b;
                    this.reset();
                },
                reset: function() {
                    q.reset.call(this);
                    this._doReset();
                },
                process: function(a) {
                    this._append(a);
                    return this._process();
                },
                finalize: function(a) {
                    a && this._append(a);
                    return this._doFinalize();
                },
                keySize: 4,
                ivSize: 4,
                _ENC_XFORM_MODE: 1,
                _DEC_XFORM_MODE: 2,
                _createHelper: function(a) {
                    return{
                        encrypt: function(b, c, d) {
                            return("string" == typeof c ? s : j).encrypt(a, b, c, d);
                        },
                        decrypt: function(b, c, d) {
                            return("string" == typeof c ? s : j).decrypt(a, b, c, d);
                        }
                    };
                }
            });
        f.StreamCipher = n.extend({
            _doFinalize: function() {
                return this._process(!0);
            },
            blockSize: 1
        });
        var m = g.mode = {},
            t = function(a, b, c) {
                var d = this._iv;
                d ? this._iv = u : d = this._prevBlock;
                for (let e =
                        0;
                    e < c;
                    e++) {
                    a[b + e] ^= d[e];
                }
            },
            h = (f.BlockCipherMode = k.extend({
                createEncryptor: function(a, b) {
                    return this.Encryptor.create(a, b);
                },
                createDecryptor: function(a, b) {
                    return this.Decryptor.create(a, b);
                },
                init: function(a, b) {
                    this._cipher = a;
                    this._iv = b;
                }
            })).extend();
        h.Encryptor = h.extend({
            processBlock: function(a, b) {
                const c = this._cipher;
                const d = c.blockSize;
                t.call(this, a, b, d);
                c.encryptBlock(a, b);
                this._prevBlock = a.slice(b, b + d);
            }
        });
        h.Decryptor = h.extend({
            processBlock: function(a, b) {
                const c = this._cipher;
                const d = c.blockSize;
                const e = a.slice(b, b + d);
                c.decryptBlock(a,
                    b);
                t.call(this, a, b, d);
                this._prevBlock = e;
            }
        });
        m = m.CBC = h;
        h = (g.pad = {}).Pkcs7 = {
            pad: function(a, b) {
                for (var c = 4 * b, c = c - a.sigBytes % c, d = c << 24 | c << 16 | c << 8 | c, e = [], f = 0; f < c; f += 4) {
                    e.push(d);
                }
                c = l.create(e, c);
                a.concat(c);
            },
            unpad: function(a) {
                a.sigBytes -= a.words[a.sigBytes - 1 >>> 2] & 255;
            }
        };
        f.BlockCipher = n.extend({
            cfg: n.cfg.extend({ mode: m, padding: h }),
            reset: function() {
                n.reset.call(this);
                var a = this.cfg;
                const b = a.iv;
                var a = a.mode;
                if (this._xformMode == this._ENC_XFORM_MODE) {
                    var c = a.createEncryptor;
                } else {
                    c = a.createDecryptor, this._minBufferSize = 1;
                }
                this._mode = c.call(a, this, b && b.words);
            },
            _doProcessBlock: function(a, b) {
                this._mode.processBlock(a, b);
            },
            _doFinalize: function() {
                const a = this.cfg.padding;
                if (this._xformMode == this._ENC_XFORM_MODE) {
                    a.pad(this._data, this.blockSize);
                    var b = this._process(!0);
                } else {
                    b = this._process(!0), a.unpad(b);
                }
                return b;
            },
            blockSize: 4
        });
        var p = f.CipherParams = k.extend({
                init: function(a) {
                    this.mixIn(a);
                },
                toString: function(a) {
                    return(a || this.formatter).stringify(this);
                }
            }),
            m = (g.format = {}).OpenSSL = {
                stringify: function(a) {
                    const b = a.ciphertext;
                    a = a.salt;
                    return(a ? l.create([1398893684, 1701076831]).concat(a).concat(b) : b).toString(r);
                },
                parse: function(a) {
                    a = r.parse(a);
                    const b = a.words;
                    if (1398893684 == b[0] && 1701076831 == b[1]) {
                        var c = l.create(b.slice(2, 4));
                        b.splice(0, 4);
                        a.sigBytes -= 16;
                    }
                    return p.create({ ciphertext: a, salt: c });
                }
            },
            j = f.SerializableCipher = k.extend({
                cfg: k.extend({ format: m }),
                encrypt: function(a, b, c, d) {
                    d = this.cfg.extend(d);
                    var e = a.createEncryptor(c, d);
                    b = e.finalize(b);
                    e = e.cfg;
                    return p.create({
                        ciphertext: b,
                        key: c,
                        iv: e.iv,
                        algorithm: a,
                        mode: e.mode,
                        padding: e.padding,
                        blockSize: a.blockSize,
                        formatter: d.format
                    });
                },
                decrypt: function(a, b, c, d) {
                    d = this.cfg.extend(d);
                    b = this._parse(b, d.format);
                    return a.createDecryptor(c, d).finalize(b.ciphertext);
                },
                _parse: function(a, b) {
                    return"string" == typeof a ? b.parse(a, this) : a;
                }
            }),
            g = (g.kdf = {}).OpenSSL = {
                execute: function(a, b, c, d) {
                    d || (d = l.random(8));
                    a = v.create({ keySize: b + c }).compute(a, d);
                    c = l.create(a.words.slice(b), 4 * c);
                    a.sigBytes = 4 * b;
                    return p.create({ key: a, iv: c, salt: d });
                }
            },
            s = f.PasswordBasedCipher = j.extend({
                cfg: j.cfg.extend({ kdf: g }),
                encrypt: function(a,
                                  b,
                                  c,
                                  d) {
                    d = this.cfg.extend(d);
                    c = d.kdf.execute(c, a.keySize, a.ivSize);
                    d.iv = c.iv;
                    a = j.encrypt.call(this, a, b, c.key, d);
                    a.mixIn(c);
                    return a;
                },
                decrypt: function(a, b, c, d) {
                    d = this.cfg.extend(d);
                    b = this._parse(b, d.format);
                    c = d.kdf.execute(c, a.keySize, a.ivSize, b.salt);
                    d.iv = c.iv;
                    return j.decrypt.call(this, a, b, c.key, d);
                }
            });
    }();