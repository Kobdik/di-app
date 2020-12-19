const map = new Map();

const n = 300;
console.time('map');
for (let i=0; i<n; i++) {
    const key = 'k'+i;
    const dec = i%10 ? null : 'dec';
    map.set(key, { key: i, expo: null, scope: dec });
}

let cnt = 0;
map.forEach((mod) => {
    if (mod.scope === 'dec') {
        //console.dir(mod);
        cnt++;
    }
});
console.timeEnd('map');
console.info(cnt);
