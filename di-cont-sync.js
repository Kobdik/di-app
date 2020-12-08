
module.exports = (logger) => {

    const map = new Map();

    const di = {
        get: (key, whom='di') => {
            const mod = map.get(key);
            //{ path, expo, inst })
            if (!mod) throw new Error(`Can't find ${key} entry for ${whom} !!`);
            if (mod.inst) return mod.inst;
            //obtain module.exports service factory
            if (!mod.expo) load(mod, whom);
            //instantiate direct or with injected dependencies
            if (!mod.expo.deps) mod.inst = mod.expo();
            else mod.inst = inject(mod);
            //dispose when used
            const inst = mod.inst;
            if (mod.detach) mod.inst = null;
            return inst;
        },
        detach: (key, value) => {
            const mod = map.get(key);
            if (!mod) throw new Error(`Can't find ${key} entry for detaching !!`);
            mod.detach = value;
        },
        set: (key, mod) => {
            if (!mod.inst && !mod.expo && !mod.path)
                logger.error(`Entry for ${key} not set !!`);
            else
                map.set(key, mod);
        },
        add: (modules) => {
            //map each key to appropriate path
            for (const key in modules) 
                map.set(key, { path: modules[key], expo: null, inst: null, detach: false });
        },
        each: (cb) => {
            //cb(mod, key, map)
            map.forEach(cb);
        },
    }

    function inject(mod) {
        const expo = mod.expo;
        const args = expo.deps.map(dep => di.get(dep, expo.sname));
        return expo.apply(null, args);
    }

    function load(mod, whom) {
        try {
            mod.expo = require(mod.path);
            logger.info(`Path: ${mod.path}`);
            return mod.expo;
        }
        catch (err) {
            throw new Error(`Can't load module from path: ${mod.path} for ${whom}!!`);
        };
    }

    map.set('di', { inst: di });
    //map.set('logger', { inst: logger });

    return di;
};

module.exports.sname = 'di container';
module.exports.deps = ['logger'];