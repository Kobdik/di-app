// create container
const DI = require('di-async');
const di = DI();
// register services
di.join(require('./modules.json'));
di.set('logger', console);
// concurent services resolving and use
console.time('async');
const p1 = di.get('accumulator').then(a1 => {
    a1.add(1);
    a1.add(4);
    console.info('Amount is %d', a1.tot);
});

const p2 = di.get('accumulator').then(a2 => {
    a2.add(10);
    a2.add(40);
    console.info('Amount is %d', a2.tot);
});

const p3 = di.get('accumulator').then(a3 => {
    a3.add(100);
    a3.add(400);
    console.info('Amount is %d', a3.tot);
});

const p0 = di.get('storage');

Promise.all([p0, p1, p2, p3]).then(r => {
    console.info('Total amount is %d', r[0].tot);
    console.timeEnd('async');
}).catch(err => console.error(`Catch on Total amount: ${err}`));;

di.get('DerivedA').then(D => {
    const d = new D('Den');
    console.info(d.name, d.sum(8, 2));
}).catch(err => console.error(`Catch on DerivedA: ${err}`));