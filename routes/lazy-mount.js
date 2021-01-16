
module.exports = (di, logger) => {
    //lazy mount at the path
    return function lazy_mount(app, path, key) {
        let mounted = false;
        app.use(path, (_req, _res, next) => {
            // when mounted skip to the next middleware
            // (router) mounted at the specified path
            if (mounted) next();
            else di.get(key, 'lazy-mount')
            .then(router => {
                // mount loaded router
                app.use(path, router);
                logger.info(`The router ${key} was mounted on ${path}`);
                mounted = true;
                next();
            })
            .catch(next);
        });
    }
};

module.exports.sname = "lazy-mount";
module.exports.deps = [ "di", "logger" ];