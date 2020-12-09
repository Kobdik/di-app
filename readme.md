# Реализация контейнера внедрения зависимостей на JavaScript

![Граф зависимоcтей](./graph.svg)

## Шаблон определения модулей Dependency Injection

Шаблон **Dependency Injection** основывается на предоставлении модулю всех зависимостей в качестве входных данных фабричной функции. Так ослабляются связи между модулями, позволяя настроить использование любых зависимостей, следовательно, повторно использовать в различных контекстах.

Дополнительно, в свойствах фабричной функции указываем массив строк с именами зависимостей (если имеются), а также для отладочных целей - поле *sname*.

``` js
//фабричная функция службы accumulator
module.exports = (storage, logger) => {
    //возвращаем экземпляр службы
}
module.exports.sname = "Accumulator service";
module.exports.deps = ["storage", "logger"];
```

Согласитесь, это не большие требования к определению модулей. Важно соблюсти порядок следования зависимостей в фабричной функции и имен зависимостей в свойстве *deps*.

## Контейнер внедрения зависимостей

Ответсвенность за создание экземпляров и дальнейший жизненный цикл, поиск и внедрение зависимостей, лежит на объекте, называемом **Dependency Injection Container** или DI-контейнер.

Моя реализация DI-контейнера также соответствует шаблону **Dependency Injection**, чтобы другие службы могли его внедрить. Такая возможность позволяет отложить загрузку (*Lazy loading*) не только службы, но и отдельных зависимостей, используя внедренный контейнер в качестве локатора служб.

Ну, а сам DI-контейнер зависит от службы *logger*, чтобы отслеживать порядок загрузки, создания экземпляров или возникающие при этом ошибки.
Пример использования синхронного DI-контейнера.

``` js
const logger = { info: console.log, error: console.error }
//const logger = require('./logger')();
const di = require('./di-cont-sync')(logger);
di.add(require('./modules.json'));

try {
    //detached, not singleton
    di.detach('accum', true);
    //but depends of singleton storage
    const a1 = di.get('accum');
    a1.add(1);
    a1.add(4);
    logger.info('Amount is %d', a1.tot);
    //Amount is 5
    const a2 = di.get('accum');
    a2.add(10);
    a2.add(40);
    logger.info('Amount is %d', a2.tot);
    //Amount is 50
    const a3 = di.get('accum');
    a3.add(100);
    a3.add(400);
    logger.info('Amount is %d', a3.tot);
    //Amount is 500
    const s = di.get('storage');
    logger.info('Total amount is %d', s.tot)
    //Total amount is 555
}
catch (err) {
    logger.error(`Catch: ${err}`);
}
```

DI-контейнер загружает описание служб из объекта, в свойствах которого указаны пути для загрузки модулей, а имена свойств - это имена регистрируемых служб. Такие объекты удобно хранить во внешних json-файлах, наподобие этого:

```json
{
    "config": "./config",
    "logger": "./logger",
    "storage": "./model/storage",
    "tresshold": "./model/tresshold",
    "accum": "./model/accumulator",
    "ClassA": "./model/class-a",
    "DerivedA": "./model/derived-a"
}
```

Регистрация служб носит отложенный характер, никакие модули не загружаются. Всё волшебство происходит в момент обращения за экземпляром службы.

## Реализация синхронного DI-контейнера
