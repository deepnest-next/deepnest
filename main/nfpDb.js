'use strict';

function clone(nfp) {
    var newnfp = [];
    for (let i = 0; i < nfp.length; i++) {
        newnfp.push({
            x: nfp[i].x,
            y: nfp[i].y
        });
    }

    if (nfp.children && nfp.children.length > 0) {
        newnfp.children = [];
        for (let i = 0; i < nfp.children.length; i++) {
            var child = nfp.children[i];
            var newchild = [];
            for (let j = 0; j < child.length; j++) {
                newchild.push({
                    x: child[j].x,
                    y: child[j].y
                });
            }
            newnfp.children.push(newchild);
        }
    }

    return newnfp;
}

function cloneNfp(nfp, inner) {
    if (!inner) {
        return clone(nfp);
    }

    // inner nfp is actually an array of nfps
    var newnfp = [];
    for (let i = 0; i < nfp.length; i++) {
        newnfp.push(clone(nfp[i]));
    }

    return newnfp;
}

const db = {};

module.exports = {
    has: function (obj) {
        var key = this._makeKey(obj);
        if (db[key]) {
            return true;
        }
        return false;
    },

    find: function (obj, inner) {
        var key = this._makeKey(obj, inner);;
        //console.log('key: ', key);
        if (db[key]) {
            return cloneNfp(db[key], inner);
        }
        /*var keypath = './nfpcache/'+key+'.json';
        if(fs.existsSync(keypath)){
            // could be partially written
            obj = null;
            try{
                obj = JSON.parse(fs.readFileSync(keypath).toString());
            }
            catch(e){
                return null;
            }
            var nfp = obj.nfp;
            nfp.children = obj.children;

            window.nfpcache[key] = clone(nfp);

            return nfp;
        }*/
        return null;
    },

    insert: function (obj, inner) {
        var key = this._makeKey(obj, inner);
        //if (window.performance.memory.totalJSHeapSize < 0.8 * window.performance.memory.jsHeapSizeLimit) {
            db[key] = cloneNfp(obj.nfp, inner);
            //console.log('cached: ',window.cache[key].poly);
            //console.log('using', window.performance.memory.totalJSHeapSize/window.performance.memory.jsHeapSizeLimit);
        //}

        /*obj.children = obj.nfp.children;

        var keypath = './nfpcache/'+key+'.json';
        fq.writeFile(keypath, JSON.stringify(obj), function (err) {
            if (err){
                console.log("couldn't write");
            }
        });*/
    },

    getCache: function () {
        return db;
    },

    getStats: function () {
        return Object.keys(db).length;
    },

    _makeKey: function (doc, inner) {
        const Arotation = parseInt(doc.Arotation);
        const Brotation = parseInt(doc.Brotation);
        // Include flipped state in the key
        const Aflipped = doc.Aflipped ? '1' : '0';
        const Bflipped = doc.Bflipped ? '1' : '0';
        return `${doc.A}-${doc.B}-${Arotation}-${Brotation}-${Aflipped}-${Bflipped}`;
    }
}