//const logger = console;
const logger = require('./logger')();
const di = require('./di-cont-sync')(logger);

di.add(require('./modules.json'));
di.set('logger', { inst:logger });

try {

    di.detach('accum', true);

    const a1 = di.get('accum');
    a1.add(1);
    a1.add(4);
    logger.info('Amount is %d', a1.tot);
    
    const a2 = di.get('accum');
    a2.add(10);
    a2.add(40);
    logger.info('Amount is %d', a2.tot);

    const a3 = di.get('accum');
    a3.add(100);
    a3.add(400);
    logger.info('Amount is %d', a3.tot);

    const s = di.get('storage');
    logger.info('Total amount is %d', s.tot)
    
    const D = di.get('DerivedA');
    const d = new D('Den');
    logger.info(d.sum(8, 2));

}
catch (err) {
    logger.error(`Catch: ${err}`);
}