const cache = {}

type NFP = {
  x: number
  y: number
}[]

type NFPsWithChildren = NFP & {
  children?: NFPsWithChildren[]
}

const resolveCacheKey = (obj): string =>
  'A' +
  obj.A +
  'B' +
  obj.B +
  'Arot' +
  parseFloat(obj.Arotation).toFixed(6) +
  'Brot' +
  parseFloat(obj.Brotation).toFixed(6)

function clone(nfp: NFPsWithChildren): NFPsWithChildren {
  const newnfp: NFPsWithChildren = []
  for (let i = 0; i < nfp.length; i++) {
    newnfp.push({
      x: nfp[i].x,
      y: nfp[i].y
    })
  }

  if (nfp.children && nfp.children.length > 0) {
    newnfp.children = []
    for (let i = 0; i < nfp.children.length; i++) {
      const child = nfp.children[i]
      const newchild: NFPsWithChildren = []
      for (let j = 0; j < child.length; j++) {
        newchild.push({
          x: child[j].x,
          y: child[j].y
        })
      }
      newnfp.children.push(newchild)
    }
  }

  return newnfp
}

function cloneNfp(nfp, inner: boolean): NFPsWithChildren {
  if (!inner) {
    return clone(nfp)
  }

  // inner nfp is actually an array of nfps
  const newnfp: NFPsWithChildren = []
  for (let i = 0; i < nfp.length; i++) {
    newnfp.push(clone(nfp[i]))
  }

  return newnfp
}

export default {
  has: (obj): boolean => {
    const key = resolveCacheKey(obj)
    if (cache[key]) {
      return true
    }
    return false
  },

  clear: (): void => {
    for (const key in cache) {
      delete cache[key]
    }
  },

  find: (obj, inner: boolean): NFPsWithChildren | null => {
    const key = resolveCacheKey(obj)
    if (cache[key]) {
      return cloneNfp(cache[key], inner)
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
			
			cache[key] = clone(nfp);
			
			return nfp;
		}*/
    return null
  },

  insert: (obj, inner: boolean): void => {
    const key = resolveCacheKey(obj)
    // if (
    //   window.performance.memory.totalJSHeapSize <
    //   0.8 * window.performance.memory.jsHeapSizeLimit
    // ) {
    cache[key] = cloneNfp(obj.nfp, inner)
    //console.log('cached: ',window.cache[key].poly);
    //console.log('using', window.performance.memory.totalJSHeapSize/window.performance.memory.jsHeapSizeLimit);
    // }

    /*obj.children = obj.nfp.children;
		
		var keypath = './nfpcache/'+key+'.json';
		fq.writeFile(keypath, JSON.stringify(obj), function (err) {
			if (err){
				console.log("couldn't write");
			}
		});*/
  },

  clone
}
