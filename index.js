const logger = console;
//const logger = require('./logger')();
const di = require('./di-cont')(logger);
di.add(require('./modules.json'));
//di.set('logger', { inst:logger });
/*
const run = async () => {

    const a1 = await di.get('accum');
    a1.add(1);
    a1.add(4);
    logger.info('Amount is %d', a1.tot);

    const a2 = await di.get('accum');
    a2.add(10);
    a2.add(40);
    logger.info('Amount is %d', a2.tot);

    const a3 = await di.get('accum');
    a3.add(100);
    a3.add(400);
    logger.info('Amount is %d', a3.tot);

    const s = await di.get('storage');
    logger.info('Total amount is %d', s.tot);

    const D = await di.get('DerivedA');
    const d = new D('Den');
    logger.info(d.sum(8, 2));

}

run().catch(err => logger.error(`Catch: ${err}`));
*/ 

/**/
di.detach('accum', true);

const p1 = di.get('accum').then(a1 => {
    a1.add(1);
    a1.add(4);
    logger.info('Amount is %d', a1.tot);
});

const p2 = di.get('accum').then(a2 => {
    a2.add(10);
    a2.add(40);
    logger.info('Amount is %d', a2.tot);
});

const p3 = di.get('accum').then(a3 => {
    a3.add(100);
    a3.add(400);
    logger.info('Amount is %d', a3.tot);
});

const p0 = di.get('storage');

Promise.all([p0, p1, p2, p3]).then(r =>
    logger.info('Total amount is %d', r[0].tot)
).catch(err => logger.error(`Catch on Total amount: ${err}`));;

di.get('DerivedA').then(D => {
    const d = new D('Den');
    logger.info(d.sum(8, 2));
}).catch(err => logger.error(`Catch on DerivedA: ${err}`));
