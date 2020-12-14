//const logger = console;
const logger = require('./logger')();
const di = require('./di-cont')(logger);

di.add(require('./modules.json'));
di.set('logger', { inst: logger });

console.time('all');
try {

    di.detach('accum', true);

    const a1 = di.getSync('accum');
    a1.add(1);
    a1.add(4);
    logger.info('Amount is %d', a1.tot);
    
    const a2 = di.getSync('accum');
    a2.add(10);
    a2.add(40);
    logger.info('Amount is %d', a2.tot);

    const a3 = di.getSync('accum');
    a3.add(100);
    a3.add(400);
    logger.info('Amount is %d', a3.tot);

    const s = di.getSync('storage');
    logger.info('Total amount is %d', s.tot)
    
    const D = di.getSync('DerivedA');
    const d = new D('Den');
    logger.info(d.sum(8, 2));

}
catch (err) {
    logger.error(`Catch: ${err}`);
}
console.timeEnd('all');