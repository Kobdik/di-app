
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
            //obtain module.exports service factory
            if (!mod.expo) {
                info(`Loading factory for ${key} from path: ${mod.path}`);
                load(mod, whom);
                process.nextTick(info, `Next tick after loading ${key}`)
            }
            //instantiate direct or with injected dependencies
            if (!mod.expo.deps) mod.inst = mod.expo();
            else mod.inst = await inject(mod);
            //dispose when used
            const inst = mod.inst;
            if (mod.swear) mod.resolve(inst);
            if (mod.detach) mod.inst = null;
            info(`Instance of ${key} successfully created`);
            process.nextTick(info, `Next tick after creating ${key}`)
            return inst;
        },
        getSync: (key, whom='di') => {
            const mod = map.get(key);
            //{ path, expo, inst })
            if (!mod) throw new Error(`Can't find ${key} entry for ${whom} !!`);
            if (mod.inst) return mod.inst;
            if (!mod.expo) {
                info(`Loading factory for ${key} from path: ${mod.path}`);
                load(mod, whom);
            }
            //instantiate direct or with injected dependencies
            if (!mod.expo.deps) mod.inst = mod.expo();
            else mod.inst = injectSync(mod);
            const inst = mod.inst;
            if (mod.detach) mod.inst = null;
            info(`Instance of ${key} successfully created (sync)`);
            return inst;
        },
        detach: (key, value) => {
            const mod = map.get(key);
            if (!mod) throw new Error(`Can't find ${key} entry for detaching !!`);
            mod.detach = value;
        },
        set: (key, mod) => {
            if (mod.inst || mod.path) map.set(key, mod);
            else throw new Error(`Entry for ${key} not set !!`);
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

    async function inject(mod) {
        const expo = mod.expo;
        const args = await Promise.all(expo.deps.map(dep => di.get(dep, expo.sname)));
        return expo.apply(null, args);
    }

    function injectSync(mod) {
        const expo = mod.expo;
        const args = expo.deps.map(dep => di.getSync(dep, expo.sname));
        return expo.apply(null, args);
    }

    function load(mod, whom) {
        try {
            //resolve service factory
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

module.exports.sname = 'di container';
module.exports.deps = ['logger'];