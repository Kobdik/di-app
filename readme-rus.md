# Реализация контейнера внедрения зависимостей на JavaScript

+ Лаконичность и декларативность в настройке сервисов
+ Отложенная неблокирующая загрузка модулей
+ Возможность отложенной загрузки зависимостей через внедрение самого контейнера
+ Поддержка времени жизни компонентов: *singleton*, *transient* и *scoped*
+ Небольшой размер модуля контейнера (около ста строк кода)
+ Асинхронная реализация разрешает конкурентное создание *singlton* зависимостей

![Граф зависимоcтей](./graph.svg)

Граф зависимоcтей описываемых примеров отражает связи между сервисами. Так, созданию *transient* экземпляра *accumulator* должно предшествовать создание *singlton* экземпляров *logger* и *storage*, а последнему - создание *singleton* экземпляра *thresshold*.

## Содержание

+ [Шаблон определения модулей Dependency Injection](#dependency-injection)
+ [Контейнер внедрения зависимостей](#dependency-injection-container)
+ [Реализация наследования классов](#реализация-наследования-классов)
+ [Регистрация модулей](#регистрация-модулей)
+ [Реализация DI-контейнера](#реализация-di-контейнера)
+ [Пример использования синхронного DI-контейнера](#Использование-синхронного-DI-контейнера)
+ [Отложенная асинхронная загрузка служб](#Отложенная-асинхронная-загрузка-служб)
+ [Реализация асинхронного DI-контейнера](#Реализация-асинхронного-DI-контейнера)
+ [Пример использования асинхронного DI-контейнера](#Использование-асинхронного-DI-контейнера)
+ [Асинхронная служба](#Асинхронная-служба)

## Dependency Injection

Шаблон **Dependency Injection** основывается на предоставлении модулю всех зависимостей в качестве входных данных. Так ослабляются связи между модулями, позволяя настроить использование любых зависимостей, следовательно, повторно использовать код в различных контекстах.

Наиболее удобным и достаточным способом передачи зависимостей является использование фабричной функции.

``` js
//фабричная функция службы accumulator
module.exports = (storage, logger) => {
    //возвращает экземпляр службы
}
module.exports.sname = "Accumulator service";
module.exports.deps = ["storage", "logger"];
```

Дополнительно, в свойствах фабричной функции указывается массив строк с именами зависимостей (если имеются), а также, для отладочных целей - свойство *sname*.

Согласитесь, это необременительные требования к определению модулей. Важно соблюсти порядок следования зависимостей в фабричной функции и имен зависимостей в свойстве *deps*.

## Реализация наследования классов

Как сказано в моей любимой книге (ISBN 978-1-83921-411-0 Node.js Design Patterns):

Природа JavaScript влияет на традиционные шаблоны проектирования. Существует так много способов реализации традиционных шаблонов проектирования в JavaScript, что традиционная, строго объектно-ориентированная реализация перестает быть релевантной.

Класс как сервис - более гибкий подход, чем использование конструктора в качестве функции внедрения зависимостей. Фабричная функция, возвращающая определение класса, даёт свободу от зависимостей конструктору.

Пусть, служба *ClassA* имеет одну зависимость и возвращает определение класса:

``` js
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
```

В таком случае, наследуемый класс можно передать фабрике как зависимость.

``` js
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
};

module.exports.sname = "derived A";
module.exports.deps = ["ClassA"];
```

Обычно, использование конструктора для внедрения зависимостей, вместо фабричной функции, добавляет необходимость регистрации аргументов конструктора как зависимостей от служб. Порой, это выглядит неоправданным, надуманным, когда в качестве службы приходится регистрировать константы. В JavaScript без этого вполне можно обойтись.

## Регистрация модулей

**Lifetime Management** - это концепция контроля количества возвращаемых экземпляров и продолжительности их жизненного цикла.

По умолчанию контейнер возвращает *singleton* экземпляр и кэширует его. По запросу контейнер всегда возвращает один и тот же экземпляр. Время жизни экземпляра связано с таковым у контейнера.

Регистрация сервиса как *transient* приводит к следующему. Возвращенный экземпляр не кэшируется в контейнере. Новый экземпляр компонента будет создаваться всякий раз, когда запрашивается сервис.

Регистрация *Singleton* сервиса.

``` js
di.set('logger', console);
// or equivalently
di.setEntry('logger', { inst: console });
```

Регистрация сразу нескольких сервисов, *accumulator* был зарегистрирован как *transient*.

``` js
di.join({
    "storage": { "path": "./services/storage" },
    "thresshold": { "path": "./services/thresshold" },
    "accumulator": { "path": "./services/accumulator", "transient": true },
    "ClassA": { "path": "./services/class-a" },
    "DerivedA": { "path": "./services/derived-a" }
});
// or from external JSON-file
di.join(require('./modules.json'));
```

Если время жизни экземпляра сервиса связано со временем жизни другого временного объекта, то сервис называют *Scoped*. Во многом его поведение похоже на *Singleton* экземпляр в пределах существования создавшего его *Scope* контейнера.

Например, чтобы должным образом настроить сервисы *middleware*, отвечающие за авторизацию и сквозную обработку данных конкретного пользователя, в рамках каждого запроса к веб-серверу нужен новый экземпляр *Scope* контейнера.

Так как предполагается частое создание *Scope* контейнеров, следует организовать совместное использование фабрик и экземпляров в выделенном контейнере.

Сначала, создайте выделенный контейнер, в котором будут хранится разделяемые сервисы. Зарегистрируйте в нем фабрики и экземпляры. Любой запрос сервиса у выделенного контейнера приведет к созданию разделяемего экземпляра.

Оставшиеся *Singleton* сервисы будут вести себя как *Scoped*, т.е. они будут уничтожены GC вместе со своими *Scope* контейнерами, как только последние покинут область видимости.

``` js
const DI = require('./di-async');
const shared = DI();
shared.join(require('./modules.json'));
// singleton instance shared with scoped containers
shared.set('logger', console );
```

Затем, с помощью метода *newScope* выделенного контейнера, создайте новые *Scope* контейнеры,
запросите у них экземпляры сервисов и выполните необходимые действия. Экземпляры сервисов сохранятся в *Scope* контейнерах, а фабрики - в разделяемом контейнере при первом же запросе сервиса.

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

Каждый экземпляр *storage* хранится в своем *Scope* контейнере. Оба *Scoped* экземпляра используют один и тот же разделяемый экземпляр *threshold* из выделенного контейнера.

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

Ответсвенность за создание экземпляров и дальнейший жизненный цикл, поиск и внедрение зависимостей, лежит на объекте, называемом **Dependency Injection Container** или DI-контейнер.

Экземпляры служб и весь граф зависимостей создаются в режиме **Lazy loading**, т.е. асинхронно и только по требованию. Нет необходимости предварительной загрузки фабрик всех модулей.

Реализация DI-контейнера соответствует шаблону **Dependency Injection**, чтобы другие службы могли его внедрить. Такая возможность позволяет отложить загрузку отдельных зависимостей, используя внедренный контейнер в качестве локатора служб.

Регистрация служб носит отложенный характер, никакие модули не загружаются. Всё волшебство происходит в момент обращения за экземпляром службы с помощью метода *getAsync*.

Если ключ <имя службы> найден, но экземпляр не создан, проверяется загружена ли фабрика, если нет, то она загружается функцией *load*.

Если у службы нет зависимостей, то для создания экземпляра вызывается фабрика без аргументов. Иначе, вызывается функция *injectAsync*, которая заполняет массив аргументов, рекурсивно запрашивая зависимости у контейнера, затем вызывает фабрику, передавая ей этот массив.

По умолчанию, возвращается *singlton* объект - служба, указатель на которую сохраняется в контейнере и возвращается при последующих запросах.

Метод *detach* DI-контейнера помечает службу как отсоединенную, или как принято называть *transient*. Запрос отсоединенной службы методом *getAsync* каждый раз возвращает новый экземпляр, не связанный с временем жизни контейнера.

## Использование синхронного DI-контейнера

```js
const logger = console;
const di = require('./di-cont')(logger);
di.add(require('./modules.json'));

try {
    //detached, not singleton
    di.detach('accum', true);
    //but depends of singleton storage
    const a1 = di.getAsync('accum');
    a1.add(1);
    a1.add(4);
    logger.info('Amount is %d', a1.tot);
    //Amount is 5
    const a2 = di.getAsync('accum');
    a2.add(10);
    a2.add(40);
    logger.info('Amount is %d', a2.tot);
    //Amount is 50
    const a3 = di.getAsync('accum');
    a3.add(100);
    a3.add(400);
    logger.info('Amount is %d', a3.tot);
    //Amount is 500
    const s = di.getAsync('storage');
    logger.info('Total amount is %d', s.tot)
    //Total amount is 555
    const D = di.getAsync('DerivedA');
    const d = new D('Den');
    logger.info(d.sum(8, 2));
    //10
}
catch (err) {
    logger.error(`Catch: ${err}`);
}
```

Отсоединенные экземпляры *accum* накапливают итоги в собственных регистрах, независимо друг от друга. Все они разделяют *singleton* зависимость *storage*, в которой накапливается общий итог всех аккумуляторов.

Служба *storage* имеет *singleton* зависимость *tresshold*, в которой хранится некоторое пороговое значение, превышение которого выводит в консоль *logger*.

DI-контейнер зависит от службы *logger*, чтобы отслеживать порядок загрузки, создания экземпляров или возникающие при этом ошибки.

Чтобы службы использовали тот же *logger*, что и контейнер, создайте и зарегистрируйте экземпляр:

``` js
const logger = require('./logger')();
const di = require('./di-cont')(logger);
di.set('logger', { inst: logger });
```

Вывод программы подтверждает, что был создан единственный экземпляр *storage* при последовательном создании трёх экземпляров *accum* и непосредственном запроса службы.

```log
info: Loading factory for accum from path: ./model/accumulator
info: Loading factory for storage from path: ./model/storage
info: Loading factory for tresshold from path: ./model/tresshold
info: Instance of tresshold successfully created (sync)
info: Instance of storage successfully created (sync)
info: Instance of accum successfully created (sync)
info: 1 added to 0
info: 4 added to 1
info: Amount is 5
info: Instance of accum successfully created (sync)
info: 10 added to 0
info: 40 added to 10
info: Amount is 50
info: Instance of accum successfully created (sync)
info: 100 added to 0
info: 400 added to 100
info: Storage limit 500 exceeded by 55 !
info: Amount is 500
info: Total amount is 555
info: Loading factory for DerivedA from path: ./model/derived-a
info: Loading factory for ClassA from path: ./model/class-a
info: Instance of ClassA successfully created (sync)
info: Instance of DerivedA successfully created (sync)
info: Den saccessfully created
info: 10
```

## Отложенная асинхронная загрузка служб

Представим веб-сервер, у которого имеются десятки служб. Если скорость его запуска критически важна, то архитектура асинхронной отложенной загрузки служб решит две задачи.

+ Во-первых, позволит приложению запускаться быстро, с минимальным количеством служб
+ Во-вторых, загружая службу и её зависимости асинхронно, сервер останется отзывчивым

Отзывчивость сервера также влияет на производительность. Пока идёт создание отложенных служб, можно одновременно отвечать на запросы к уже запущенным службам, например, доступа к БД. Пока службы запустятся, ответы от БД, возможно, уже поступят.

Если служба имеет своё дерево отложенных зависимостей, то процесс создания экземпляра может растянутся на несколько циклов событий.

Когда происходит несколько конкурентных запросов на создание *singleton* службы, которая имеет отложенные зависимости, велика вероятность создания дубликатов, что в данном случае неприемлемо.

Решением является следующий подход. Контейнер начинает исполнение кода *get* по созданию *singleton* экземпляра с зависимостями, только для первого обратившегося, а остальным отправляет один и тот же промис, который разрешится созданным экземпляром.

## Реализация асинхронного DI-контейнера

В реализацию контейнера добавлен асинхронный метод *get*, который в свою очередь вызывает асинхронную функцию *inject*.

```js
module.exports = ({info}) => {

    const map = new Map();

    const di = {
        get: async (key, whom='di') => {
            const mod = map.get(key);
            //{ path, expo, inst })
            if (!mod) throw new Error(`Can't find ${key} entry for ${whom} !!`);
            if (mod.inst) return mod.inst;
            if (mod.expo && !mod.detach) {
                info(`Promise singleton creation of ${key}`);
                if (!mod.swear)
                    mod.swear = new Promise(resolve => mod.resolve = resolve);
                return mod.swear;
            }
            //obtain service factory
            if (!mod.expo) {
                info(`Loading factory for ${key} from path: ${mod.path}`);
                load(mod, whom);
                process.nextTick(info, `Next tick after loading ${key}`)
            }
            //instantiate direct or with injected dependencies
            if (!mod.expo.deps) mod.inst = mod.expo();
            else mod.inst = await inject(mod);

            const inst = mod.inst;
            if (mod.swear) mod.resolve(inst);
            if (mod.detach) mod.inst = null;
            info(`Instance of ${key} successfully created`);
            process.nextTick(info, `Next tick after creating ${key}`)
            return inst;
        },
        getSync: (key, whom='di') => { /*без изменений*/ },
        detach: (key, value) => { /*без изменений*/ },
        set: (key, mod) => { /*без изменений*/ },
        add: (modules) => { /*без изменений*/ },
        each: (cb) => { /*без изменений*/ },
    }

    async function inject(mod) {
        const expo = mod.expo;
        const args = await Promise.all(expo.deps.map(dep => 
            di.get(dep, expo.sname)
        ));
        return expo.apply(null, args);
    }

    function load(mod, whom) { /*без изменений*/ }

    map.set('di', { inst: di });

    return di;
};

module.exports.sname = 'di-container';
module.exports.deps = ['logger'];
```

В рабочем варианте следует закомментировать все строки с информационным выводом и убрать зависимость от логгера.

## Использование асинхронного DI-контейнера

Имеется три конкурентных запроса на создание отсоединенных экземпляров службы *accum*, у которой имеется неразрешенная зависимость *storage*, а у неё в свою очередь - *tresshold*.

``` js
const logger = require('./logger')();
const di = require('./di-cont')(logger);
di.add(require('./modules.json'));

di.set('logger', { inst:logger });
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
```

Первый же запрос экземпляра *accum* загрузит фабрику этой службы, рекурсивно загрузит фабрику *storage*, рекурсивно загрузит фабрику и создаст экземпляр *tresshold*.

Далее, контейнер будет ожидать разрешения массива промисов на создание зависимостей *storage* и *logger*. Ожидать останется только экземпляр *storage*, так как *logger* уже разрешен.

В этом же цикле событий второй и третий запросы экземпляра *accum*, рекурсивно запросят зависимость *storage* и получат один и тот же промис на его создание. Далее в коде идет непосредственный запрос экземпляра *storage*, в ответ придет тот же промис на его создание.

Ко второму циклу событий все конечные зависимости уже созданы. Каскадно разрешатся промисы первого цикла, будет создан экземпляр *storage* и разрешится промис на его создание, и будут созданы все три экземпляра *accum*, затем будет выполнена работа с ними.

Вывод программы подтверждает, что был создан единственный экземпляр *storage* при конкурентном обращении от трёх экземпляров *accum* и непосредственного запроса службы.

```log
info: Loading factory for accum from path: ./model/accumulator
info: Loading factory for storage from path: ./model/storage
info: Loading factory for tresshold from path: ./model/tresshold
info: Instance of tresshold successfully created
info: Promise singleton creation of storage
info: Promise singleton creation of storage
info: Promise singleton creation of storage
info: Loading factory for DerivedA from path: ./model/derived-a
info: Loading factory for ClassA from path: ./model/class-a
info: Next tick after loading accum
info: Next tick after loading storage
info: Next tick after loading tresshold
info: Next tick after creating tresshold
info: Next tick after loading DerivedA
info: Next tick after loading ClassA
info: Instance of storage successfully created
info: Instance of ClassA successfully created
info: Instance of accum successfully created
info: Instance of DerivedA successfully created
info: Instance of accum successfully created
info: Instance of accum successfully created
info: 1 added to 0
info: 4 added to 1
info: Amount is 5
info: Den saccessfully created
info: 10
info: 10 added to 0
info: 40 added to 10
info: Amount is 50
info: 100 added to 0
info: 400 added to 100
info: Storage limit 500 exceeded by 55 !
info: Amount is 500
info: Total amount is 555
info: Next tick after creating storage
info: Next tick after creating ClassA
info: Next tick after creating accum
info: Next tick after creating DerivedA
info: Next tick after creating accum
info: Next tick after creating accum
```

Вывод программы показывает, что запуск службы *DerivedA* осуществился раньше *accum*.

## Асинхронная служба

Если экземпляр службы в момент создания ещё не готов к работе, например, нуждается в дополнительной подгрузке данных, то в качестве экземпляра асинхронной службы можно вернуть промис, который разрешится готовым к использованию рабочим экземпляром.

Только ради демонстрации возможности, изменим модуль *derived-a.js* и симулируем задержку готовности экземпляра службы *DerivedA*.

``` js
module.exports = (ClassA) => {

    class DerivedA extends ClassA {
        constructor(name) {
            super(name);
        }

        sum(a, b) {
            return a + b;
        }
    }
    //return DerivedA;
    return new Promise(resolve => setTimeout(resolve, 2000, DerivedA));
};

module.exports.sname = "derived A";
module.exports.deps = ["ClassA"];
```

Вывод показывает, что с получением экземпляра *DerivedA* происходит задержка на 2 сек, работа производится с "готовым к использованию" экземпляром.

```log
.........................
info: Total amount is 555
info: Next tick after creating storage
info: Next tick after creating ClassA
info: Next tick after creating accum
info: Next tick after creating accum
info: Next tick after creating accum
info: Instance of DerivedA successfully created
info: Den saccessfully created
info: 10
info: Next tick after creating DerivedA
```

+ [Вернуться в начало к содержанию](#Содержание)
