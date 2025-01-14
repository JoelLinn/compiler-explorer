// Copyright (c) 2018, Compiler Explorer Authors
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import {replace, restore, stub} from 'sinon';

import {StorageBase} from '../../lib/storage';
import {should} from '../utils';

describe('Hash tests', () => {
    afterEach(() => restore());
    it('should never generate invalid characters', () => {
        for (let i = 0; i < 256; ++i) {
            const buf = Buffer.of(i);
            const as64 = StorageBase.encodeBuffer(buf);
            as64.should.not.contain('/');
            as64.should.not.contain('+');
        }
    });
    const badResult = 'R0Buttabcdefghio1327698asdhjkJJklQp'.toLowerCase(); // Butt hash, see https://github.com/compiler-explorer/compiler-explorer/issues/1297
    it('should detect profanities in hashes', () => {
        StorageBase.isCleanText('I am the very model of a major general').should.be.true;
        StorageBase.isCleanText(badResult).should.be.false;
    });
    it('should avoid profanities and illegible characters in hashes', () => {
        const testCase = {some: 'test'};
        const goodResult = 'uy3AkJTC9PRg8LfxqcxuUgKrCb-OatsRW7FAAVi3-4M'; // L in 13th place: OK
        const callback = stub()
            .onFirstCall()
            .returns(badResult)
            .onSecondCall()
            .returns(badResult) // force nonce to update a couple of times
            .returns(goodResult);
        replace(StorageBase, 'encodeBuffer', callback);
        const {config, configHash} = StorageBase.getSafeHash(testCase);
        configHash.should.not.equal(badResult);
        configHash.should.equal(goodResult);
        const asObj = JSON.parse(config);
        should.exist(asObj.nonce);
        asObj.nonce.should.equal(2);
    });

    it('should not modify ok hashes', () => {
        const testCase = {some: 'test'};
        const {config} = StorageBase.getSafeHash(testCase);
        const asObj = JSON.parse(config);
        should.not.exist(asObj.nonce);
    });
});
