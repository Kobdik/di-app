# DI-Async

Laconic Asynchronous Dependency Injection container for JavaScript

+ Declarative definition and **Lazy Loading** of modules
+ Asynchronous creation of services
+ Tiny size and flexible clear API
+ Ability to inject the same dependencies concurrently
+ **Lifetime Management**: Singleton, Transient and Scoped lifetime

## Table of contents

+ [Installation](#Installation)
+ [Usage](#Usage)
+ [Dependencies graph](#Dependencies-graph)
+ [Dependency Injection pattern](#Dependency-Injection-pattern)
+ [Registering modules](#Registering-modules)
+ [Dependency Injection Container](#Dependency-Injection-Container)

## Installation

Install with `npm`

``` cmd
npm install di-async --save
```

## Usage

DI-Async has a simple clear API. You need to do few things:

+ Refactor your modules leveraging the [DI pattern](#Dependency-Injection-pattern)
+ Create a [DI Container](#Dependency-Injection-Container)
+ [Register](#Registering-modules) some modules in it
+ Resolve services and use

``` js
// simple-sync.js
// create container
const DI = require('di-async');
const di = DI();
// register services
di.join(require('./modules.json'));
di.set('logger', console );
// synchronous services resolving and use
try {
    
    const a1 = di.getSync('accumulator');
    a1.add(1);
    a1.add(4);
    console.info('Amount is %d', a1.tot);

    const a2 = di.getSync('accumulator');
    a2.add(10);
    a2.add(40);
    console.info('Amount is %d', a2.tot);

    const a3 = di.getSync('accumulator');
    a3.add(100);
    a3.add(400);
    console.info('Amount is %d', a3.tot);

    const s = di.getSync('storage');
    console.info('Total amount is %d', s.tot);

    const D = di.getSync('DerivedA');
    const d = new D('Den');
    console.info(d.name, d.sum(8, 2));

}
catch (err) {
    console.error(`Catch: ${err}`)
};

```

Application still staying responsible for IO events, resolving services with asynchronous approach.

``` js
// simple.js
// create container
const DI = require('di-async');
const di = DI();
// register services
di.join(require('./modules.json'));
di.set('logger', console );
// sequential services resolving and use
const run = async () => {
    
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

};

run().catch(err => console.error(`Catch: ${err}`));
```

Both outputs are the same.

``` log
1 added to 0
4 added to 1
Amount is 5
10 added to 0
40 added to 10
Amount is 50
100 added to 0
400 added to 100
Storage limit 500 exceeded by 55 !
Amount is 500
Total amount is 555
Den saccessfully created
Den 10
```

You can try services resolution concurrently.

``` js
// concurrent.js
// create container
const DI = require('di-async');
const di = DI();
// register services
di.join(require('./modules.json'));
di.set('logger', console);
// concurrently services resolving and use
const p1 = di.get('accumulator').then(a1 => {
    a1.add(1);
    a1.add(4);
    logger.info('Amount is %d', a1.tot);
});

const p2 = di.get('accumulator').then(a2 => {
    a2.add(10);
    a2.add(40);
    logger.info('Amount is %d', a2.tot);
});

const p3 = di.get('accumulator').then(a3 => {
    a3.add(100);
    a3.add(400);
    logger.info('Amount is %d', a3.tot);
});

const p0 = di.get('storage');

Promise.all([p0, p1, p2, p3]).then(r => {
    logger.info('Total amount is %d', r[0].tot)
}).catch(err => logger.error(`Catch on Total amount: ${err}`));

di.get('DerivedA').then(D => {
    const d = new D('Den');
    logger.info(d.name, d.sum(8, 2));
}).catch(err => logger.error(`Catch on DerivedA: ${err}`));
```

Output show that Den shifted forward by three positions.

``` js
1 added to 0
4 added to 1
Amount is 5
Den saccessfully created
Den 10
10 added to 0
40 added to 10
Amount is 50
100 added to 0
400 added to 100
Storage limit 500 exceeded by 55 !
Amount is 500
Total amount is 555
```

## Dependencies graph

![Example of the Dependencies graph](./graph.svg)

The example of the Dependencies graph represent dependencies of several services towards each other. Directions of graph links assumed from bottom to top.

## Dependency Injection pattern

Dependency Injection (DI) is a pattern where the dependencies
of a service component are provided as input by the external entity often called the injector.

Refactor your modules to accomplish DI patterns as shown below. Every service module exports a fabric function with *deps* property set to an array of dependencies names.

``` js
// accumulator.js 
// fabric function of accumulator service
module.exports = (storage, logger) => {
    let acc = 0;
    // returned instance
    return {
        add(a) {
            acc += a;
            logger.info(`${a} added to ${acc}`);
            storage.add(a);
            if (storage.exceeded)
                logger.info(`Storage limit ${storage.limit} exceeded by ${storage.tot - storage.limit} !`);
        },
        get tot() {
            return acc;
        },
    }
}
module.exports.sname = "Accumulator service";
module.exports.deps = ["storage", "logger"];

// storage.js
// fabric function of storage service
module.exports = (thresshold) => {
    let acc = 0;
    return {
        add(a) {
            acc += a;
        },
        get exceeded() {
            return acc > thresshold.val;
        },
        get limit() {
            return thresshold.val;
        },
        get tot() {
            return acc;
        }
    }
};
module.exports.sname = "Storage service";
module.exports.deps = ["thresshold"];

// thresshold.js
// fabric function without dependencies
module.exports = () => {
    let limit = 500;
    return {
        set val(a) {
            limit = a;
        },
        get val() {
            return limit;
        },
    }
};
module.exports.sname = "Thresshold";
```

As said in my favorite book (**Node.js Design Patterns** ISBN 978-1-83921-411-0):
> The nature of JavaScript affects traditional design patterns. There are so many ways in which traditional design patterns can be implemented in JavaScript that the traditional, strongly object-oriented implementation stops being relevant.

Class as service is a more flexible approach than instance creation by constructor.
Constructor arguments stay free from dependencies. There is no need to register constants as input services.

``` js
// class-a.js
// class defined inside factory function
module.exports = (logger) => {
    class ClassA {

        constructor(name) {
            this._name = name;
            logger.info(`${this.name} saccessfully created`);
        }

        get name() {
            return this._name;
        }
    }
    return ClassA;
};
module.exports.sname = "class A";
module.exports.deps = ["logger"];

// derived-a.js
// derived class defined inside factory function
module.exports = (ClassA) => {

    class DerivedA extends ClassA {
        constructor(name) {
            super(name);
        }

        sum(a, b) {
            return a + b;
        }
    }
    return DerivedA;
    // just to simulate delayed service
    // return new Promise(resolve => setTimeout(resolve, 2000, DerivedA));
};

module.exports.sname = "derived A";
module.exports.deps = ["ClassA"];
```

## Registering modules

**Lifetime Management** is the concept of regulating the number of returned instances and the duration of the lifetime of those instances.

By default, container return *Singleton* instance and holds on reference to it. Container always return that same instance.

Registering service as *Transient* lead to another outcome. Returned instance is not cached in container. A new instance of the component will be created each time the service is requested from the container.

Registering *Singleton* service instance.

``` js
di.set('logger', console);
// or equivalently
di.setEntry('logger', { inst: console });
```

Registering multiple services. The last one registered as *Transient*.

``` js
di.join({
    "storage": { "path": "./services/storage" },
    "thresshold": { "path": "./services/thresshold" },
    "accumulator": { "path": "./services/accumulator", "transient": true } 
});
// or from external JSON-file
di.join(require('./modules.json'));
```

The *Scoped* service behaves much like the *Singleton* service within a single, well-defined scope.

To obtain *Scoped* service behavior create new container as well-defined scope and register appropriate services. To optimize execution performance shares service factories and instances in the dedicated container.

``` js
const DI = require('./di-async');
const shared = DI();
shared.join(require('./modules.json'));
// singleton instance shared with scoped containers
shared.set('logger', console );
```

Then create new scoped containers within method *newScope* of shared container and do some requests. The *storage* dependency of the *accumulator* service behaves like *Scoped*.

``` js
const run = async () => {
    // singleton instance shared with scoped containers
    const lim = await shared.get('thresshold');

    lim.val = 50;
    const scope1 = shared.newScope();
    
    const a11 = await scope1.get('accumulator');
    a11.add(1);
    a11.add(4);
    console.info('Amount is %d', a11.tot);

    const a12 = await scope1.get('accumulator');
    a12.add(10);
    a12.add(40);
    console.info('Amount is %d', a12.tot);

    // Singleton instance within scope1
    const s1 = await scope1.get('storage');
    console.info('Total amount is %d', s1.tot);

    lim.val = 100;
    const scope2 = shared.newScope();
    
    const a21 = await scope2.get('accumulator');
    a21.add(1);
    a21.add(9);
    console.info('Amount is %d', a21.tot);

    const a22 = await scope2.get('accumulator');
    a22.add(10);
    a22.add(90);
    console.info('Amount is %d', a22.tot);

    // Singleton instance within scope2
    const s2 = await scope2.get('storage');
    console.info('Total amount is %d', s2.tot);

};

run().catch(err => console.error(`Catch: ${err}`));

```

Each instances of the *storage* service have they own scope. Both share the same instance of *threshold*.

``` log
1 added to 0
4 added to 1
Amount is 5
10 added to 0
40 added to 10
Storage limit 50 exceeded by 5 !
Amount is 50
Total amount is 55
1 added to 0
9 added to 1
Amount is 10
10 added to 0
90 added to 10
Storage limit 100 exceeded by 10 !
Amount is 100
Total amount is 110
```

## Dependency Injection Container

DI-Async loads service modules in a non-blocking manner only when needed, therefore performs **Lazy Loading** strategy.

Container implementation allows concurrently load the same *Singleton* dependency. In example program *concurrent.js*, shown above, there are four concurrent requests to *storage* dependency. Only one request initializes service instance within method *get*, another three obtained the same promise.

+ [Go to top](#DI-Async)