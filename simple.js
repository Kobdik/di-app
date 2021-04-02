const DI = require('di-async');
const di = DI();
di.join(require('./modules.json'));
di.set('logger', console );

const run = async () => {
    
    console.time('async');
    const a1 = await di.get('accumulator');
    a1.add(1);
    a1.add(4);
    console.info('Amount is %d', a1.tot);

    const a2 = await di.get('accumulator');
    a2.add(10);
    a2.add(40);
    console.info('Amount is %d', a2.tot);

    const a3 = await di.get('accumulator');
    a3.add(100);
    a3.add(400);
    console.info('Amount is %d', a3.tot);

    const s = await di.get('storage');
    console.info('Total amount is %d', s.tot);

    const D = await di.get('DerivedA');
    const d = new D('Den');
    console.info(d.name, d.sum(8, 2));
    console.timeEnd('async');
};

run().catch(err => console.error(`Catch: ${err}`));