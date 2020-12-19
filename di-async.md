# DI-Async

Laconic Asynchronous Dependency Injection container for JavaScript

+ Declarative definition and Lazy loading of modules
+ Asynchronous creation of services
+ Lifetime managment: singleton, transient and scoped services
+ Tiny size and flexible clear API
+ Ability to inject the same dependencies concurrently

## Table of contents

+ [Installation](#Installation)
+ [Usage](#Usage)
+ [Dependencies graph](#Dependencies-graph)
+ [Dependency Injection pattern](#Dependency-Injection-pattern)
+ [Dependency Injection Container](#Dependency-Injection-Container)

## Installation

Install with `npm`

``` cmd
npm install di-async --save
```

## Usage

DI-Async has a simple clear API. You need to do few things:

+ Refactor your modules leveraging the [DI-pattern](#Dependency-Injection-pattern)
+ Create a [DI-container](#Dependency-Injection-Container)
+ [Register](#Registering-modules) some modules in it
+ Resolve services and use

``` js
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

Application still stay responsible, when resolving services with async approach.

``` js
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

Output show that Dan shifted forward by three positions.

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

Example of the Dependencies graph represent dependencies of several services towards each other. Directions of graph links assumed from bottom to top.

## Dependency Injection pattern

Dependency Injection (DI) is a pattern where the dependencies
of a service component are provided as input by external entity often called the injector.

Refactor your modules to accomplish DI pattern as shown below. Every service module exports fabric function with *deps* property set to array of dependencies names.

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
module.exports = (tresshold) => {
    let acc = 0;
    return {
        add(a) {
            acc += a;
        },
        get exceeded() {
            return acc > tresshold.val;
        },
        get limit() {
            return tresshold.val;
        },
        get tot() {
            return acc;
        }
    }
};
module.exports.sname = "Storage service";
module.exports.deps = ["tresshold"];

// tresshold.js
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
module.exports.sname = "Tresshold";
```

As said in my favorite book (**Node.js Design Patterns** ISBN 978-1-83921-411-0):
> The nature of JavaScript affects traditional design patterns. There are so many ways in which traditional design patterns can be implemented in JavaScript that the traditional, strongly object-oriented implementation stops being relevant.

Class as service is more flexible approach than instance creation by constructor.
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
    // just to simulate delayed service return Promise
    // return new Promise(resolve => setTimeout(resolve, 2000, DerivedA));
};

module.exports.sname = "derived A";
module.exports.deps = ["ClassA"];
```

## Registering modules

Registering singleton service instance.

``` js
di.set('logger', console);
// or
di.setEntry('logger', { inst: console });
```

Registering three service factories. Last one returns new instance on each request.

``` js
di.join({
    "storage": { "path": "./services/storage" },
    "tresshold": { "path": "./services/tresshold" },
    "accumulator": { "path": "./services/accumulator", "transient": true } 
});
```

## Dependency Injection Container

Ответсвенность за создание экземпляров и дальнейший жизненный цикл, поиск и внедрение зависимостей, лежит на объекте, называемом **Dependency Injection Container** или DI-контейнер.

Экземпляры служб и весь граф зависимостей создаются в *ленивом* режиме (**Lazy loading**) без необходимости предварительной загрузки модулей.

Реализация DI-контейнера соответствует шаблону **Dependency Injection**, чтобы другие службы могли его внедрить. Такая возможность позволяет отложить загрузку отдельных зависимостей, используя внедренный контейнер в качестве локатора служб.

Вывод показывает, что с получением экземпляра *DerivedA* происходит задержка на 2 сек, работа производится с "готовым к использованию" экземпляром.

+ [Go to top](#DI-Async)
