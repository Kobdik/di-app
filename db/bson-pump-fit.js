const BSON = require('bson');

module.exports = () => {

    const bson = new BSON([BSON.Binary, BSON.Decimal128, BSON.Double, BSON.Int32, BSON.Long, BSON.Map, BSON.MaxKey, BSON.MinKey, BSON.ObjectId, BSON.BSONRegExp, BSON.Timestamp]);

    return function pump(stream, rows, cb) {
        let tot, fit, bin, raw, tail = null, offset = 0, cnt = 0, len = 0, size = 0;
        // read stream chunk by chunk
        stream.on('readable', () => {
            let buf = stream.read();
            if (!buf) {
                console.log('no data to read');
                return;
            }
            tot = buf.length;
            //if (tot < 1024) console.log(tot, 'buf len');
            offset = 0;
            raw = null;
            if (fit > 0) {
                // finally (len, fit, bin) => len
                while (fit > 0) {
                    len += bin * buf.readUInt8(offset);
                    //console.log(fit, len, ' - pulled len after');
                    bin = bin << 8;
                    offset++;
                    fit--;
                }
                raw = Buffer.alloc(len);
                raw.writeInt32LE(len);
                buf.copy(raw, 4, offset, offset + len - 4);
                //console.log(cnt, `pulled - buf.len: ${tot}, offset: ${offset}, raw len: ${len}`);
                offset += len - 4;
            }
            if (tail) {
                raw = Buffer.alloc(len);
                tail.copy(raw);
                offset = len - tail.length;
                buf.copy(raw, tail.length, 0, offset);
                //console.log(cnt, `normal - buf.len: ${tot}, tail.len: ${tail.length}, offset: ${offset}, raw len: ${len}`);
            }
            if (raw) {
                cnt++;
                size += len;
                //console.log(cnt, len, 'sewed raw');
                const row = bson.deserialize(raw);
                rows.push(row);
            }
            //main loop
            let done = false;
            while (!done) {
                len = buf.readInt32LE(offset);
                //what if there are no 4 bytes?
                done = offset + len > tot - 4;
                if (offset + len <= tot) {
                    cnt++;
                    //console.log(cnt, offset, len);
                    const row = bson.deserialize(buf.slice(offset, offset + len));
                    //if (cnt < 21) console.log(cnt, row);
                    rows.push(row);
                    offset += len;
                    size += len;
                }
            }
            // offer fit or tail
            fit = 0, tail = null;
            // fit to 4 bytes
            if (offset < tot && tot < offset + 4) {
                // partially offer bin and len
                len = 0, bin = 1, fit = 4;
                while (offset < tot) {
                    //bin = bins[fit];
                    len += bin * buf.readUInt8(offset);
                    //console.log(fit, len, ' - pulled len before');
                    bin = bin << 8;
                    offset++;
                    fit--;
                }
            }
            if (offset < tot) {
                // use len later
                tail = Buffer.alloc(tot - offset);
                buf.copy(tail, 0, offset, tot);
            }
            // buffer drained
            cb(cnt, size, false);
        });
        
        stream.on('end', () => {
            //console.log(cnt, size, 'end');
            cb(cnt, size, true);
        });

    }
}

module.exports.sname = "bson-pump";