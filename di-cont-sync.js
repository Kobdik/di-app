
module.exports = ({info}) => {

    const map = new Map();

    const di = {
        get: (key, whom='di') => {
            const mod = map.get(key);
            //{ lib: {path, expo, transient}, inst })
            if (!mod) throw new Error(`Can't find ${key} entry for ${whom} !!`);
            if (mod.inst) return mod.inst;
            const lib = mod.lib;
            if (!lib) throw new Error(`Can't read ${key} module description for ${whom} !!`);
            if (!lib.expo) {
                info(`Loading factory for ${key} from path: ${lib.path}`);
                lib.expo = load(lib, whom);
            }
            //instantiate direct or with injected dependencies
            if (!lib.expo.deps) mod.inst = lib.expo();
            else mod.inst = inject(lib);
            const inst = mod.inst;
            if (mod.transient) mod.inst = null;
            info(`Instance of ${key} successfully created (sync)`);
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
    }

    function inject(mod) {
        const expo = mod.expo;
        const args = expo.deps.map(dep => di.get(dep, expo.sname));
        return expo.apply(null, args);
    }

    function load(mod, whom) {
        try {
            //expose module.exports service factory
            mod.expo = require(mod.path);
            return mod.expo;
        }
        catch (err) {
            throw new Error(`Can't load module from path: ${mod.path} for ${whom}!!`);
        };
    }

    map.set('di', { inst: di });

    return di;
};

module.exports.sname = 'di cont-sync';
module.exports.deps = ['logger'];