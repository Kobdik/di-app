// DI Container with logging
module.exports = function createDI () {

    const map = new Map();

    const di = {
        get: async (key, whom='di') => {
            const mod = map.get(key);
            //{ lib: {path, expo, transient, scope}, inst })
            if (!mod) throw new Error(`Can't find ${key} entry for ${whom} !!`);
            if (mod.inst) return mod.inst;
            const lib = mod.lib;
            if (!lib) throw new Error(`Can't read ${key} module description for ${whom} !!`);
            if (mod.marked && !lib.transient) {
                console.info(`Promise singleton creation of ${key}`);
                if (!mod.swear) mod.swear = new Promise(resolve => mod.resolve = resolve);
                return mod.swear;
            }
            mod.marked = true;
            //obtain module.exports service factory
            if (!lib.expo) {
                console.info(`Loading factory for ${key} from path: ${lib.path}`);
                lib.expo = load(lib, whom);
                process.nextTick(console.info, `Next tick after loading ${key}`)
            }
            //instantiate direct or with injected dependencies
            if (!lib.expo.deps) mod.inst = lib.expo();
            else mod.inst = await inject(lib);
            //dispose when used
            const inst = mod.inst;
            if (mod.swear) mod.resolve(inst);
            if (lib.transient) mod.inst = null;
            console.info(`Instance of ${key} successfully created`);
            process.nextTick(console.info, `Next tick after creating ${key}`)
            return inst;
        },
        getSync: (key, whom='di') => {
            const mod = map.get(key);
            //{ lib: {path, expo, transient}, inst })
            if (!mod) throw new Error(`Can't find ${key} entry for ${whom} !!`);
            if (mod.inst) return mod.inst;
            const lib = mod.lib;
            if (!lib) throw new Error(`Can't read ${key} module description for ${whom} !!`);
            if (!lib.expo) {
                console.info(`Loading factory for ${key} from path: ${lib.path}`);
                lib.expo = load(lib, whom);
            }
            //instantiate direct or with injected dependencies
            if (!lib.expo.deps) mod.inst = lib.expo();
            else mod.inst = injectSync(lib);
            const inst = mod.inst;
            if (mod.transient) mod.inst = null;
            console.info(`Instance of ${key} successfully created (sync)`);
            return inst;
        },
        set: (key, inst) => {
            if (!inst) throw new Error(`Singleton instance for ${key} not set !!`);
            else map.set(key, { inst });
        },
        setEntry: (key, mod) => {
            if (mod.inst || mod.lib && mod.lib.path) map.set(key, mod);
            else throw new Error(`Entry for ${key} not set !!`);
        },
        join: (modules) => {
            //map each key to appropriate path
            for (const key in modules) {
                map.set(key, { lib: modules[key], marked: false, inst: null });
            }
        },
        each: (cb) => {
            //cb(mod, key, map)
            map.forEach(cb);
        },
        newScope: () => {
            const scope = createDI({ info });
            map.forEach((mod, key) => {
                scope.setEntry(key, { ...mod });
            });
            return scope;
        },
    }

    async function inject(lib) {
        const expo = lib.expo;
        const args = await Promise.all(expo.deps.map(dep => di.get(dep, expo.sname)));
        return expo.apply(null, args);
    }

    function injectSync(lib) {
        const expo = lib.expo;
        const args = expo.deps.map(dep => di.getSync(dep, expo.sname));
        return expo.apply(null, args);
    }

    function load(lib, whom) {
        try {
            //exports service factory
            return require(lib.path);
        }
        catch (err) {
            throw new Error(`Can't load module from path: ${lib.path} for ${whom}!!`);
        };
    }

    map.set('di', { inst: di });

    return di;
};

module.exports.sname = 'di container';