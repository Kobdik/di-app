
module.exports = (stream_router, di) => {
    //lazy mount path
    function mount(app, path, key) {
        let mounted = false;
        app.use(path, (req, res, next) => {
            //console.log(path, req.path);
            if (mounted) next();
            else di.get(key, 'lazy-mount')
                .then(router => {
                    if (router) {
                        app.use(path, router);
                        console.log(`Router ${key} was mounted on ${path}`);
                        mounted = true;
                        next();
                    }
                    else next(`Can't mount router ${key} on ${path} !!`);
                })
                .catch(next);
        });
    }

    return { stream_router, mount };
};

module.exports.sname = "app-routes";
module.exports.deps = ["stream_router", "di"];