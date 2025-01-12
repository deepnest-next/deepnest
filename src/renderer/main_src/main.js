'use strict'

import '../../../main/style.css'
import '../backend_src/util/pathsegpolyfill'
import '../backend_src/util/simplify'
import './deepnest'
import './svgparser'
import svgPanZoom from 'svg-pan-zoom'
import Ractive from 'ractive'
import interact from 'interactjs'

import pjson from '../../../package.json?asset'

// UI-specific stuff in this script
function ready(fn) {
  if (document.readyState != 'loading') {
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}

/*
TODO: Re-enable these imports via preload script
const remote = require('@electron/remote')
const { dialog } = remote
const fs = require('graceful-fs')
const FormData = require('form-data')
const axios = require('axios').default
const http = require('http')
const path = require('path')
const svgPreProcessor = require('@deepnest/svg-preprocessor')
*/
ready(async function () {
  document.getElementById('nest').style.display = 'block'
  // main navigation
  var tabs = document.querySelectorAll('#sidenav li')

  Array.from(tabs).forEach((tab) => {
    tab.addEventListener('click', function (e) {
      if (this.className == 'active' || this.className == 'disabled') {
        return false
      }

      var activetab = document.querySelector('#sidenav li.active')
      activetab.className = ''

      var activepage = document.querySelector('.page.active')
      activepage.className = 'page'

      this.className = 'active'
      let tabpage = document.querySelector('#' + this.dataset.page)
      tabpage.className = 'page active'

      if (tabpage.getAttribute('id') == 'home') {
        resize()
      }
      return false
    })
  })

  // config form

  const defaultConversionServer = 'http://convert.deepnest.io'

  var defaultconfig = {
    units: 'inch',
    scale: 72, // actual stored value will be in units/inch
    spacing: 0,
    curveTolerance: 0.72, // store distances in native units
    rotations: 4,
    threads: 4,
    populationSize: 10,
    mutationRate: 10,
    placementType: 'box', // how to place each part (possible values gravity, box, convexhull)
    mergeLines: true, // whether to merge lines
    timeRatio: 0.5, // ratio of material reduction to laser time. 0 = optimize material only, 1 = optimize laser time only
    simplify: false,
    dxfImportScale: '1',
    dxfExportScale: '72',
    endpointTolerance: 0.36,
    conversionServer: defaultConversionServer,
    useSvgPreProcessor: false,
    useQuantityFromFileName: false
  }

  // Removed `electron-settings` while keeping the same interface to minimize changes
  const config = (window.config = {
    ...defaultconfig,
    ...(await window.electron.ipcRenderer.invoke('read-config')),
    getSync(k) {
      return typeof k === 'undefined' ? this : this[k]
    },
    setSync(arg0, v) {
      if (typeof arg0 === 'object') {
        for (const key in arg0) {
          this[key] = arg0[key]
        }
      } else if (typeof arg0 === 'string') {
        this[arg0] = v
      }
      window.electron.ipcRenderer.invoke('write-config', JSON.stringify(this, null, 2))
    },
    resetToDefaultsSync() {
      this.setSync(defaultconfig)
    }
  })

  var cfgvalues = config.getSync()
  window.DeepNest.config(cfgvalues)
  updateForm(cfgvalues)

  var inputs = document.querySelectorAll('#config input, #config select')

  Array.from(inputs).forEach((i) => {
    i.addEventListener('change', function (e) {
      var val = i.value
      var key = i.getAttribute('data-config')

      if (key == 'scale') {
        if (config.getSync('units') == 'mm') {
          val *= 25.4 // store scale config in inches
        }
      }

      if (
        ['mergeLines', 'simplify', 'useSvgPreProcessor', 'useQuantityFromFileName'].includes(key)
      ) {
        val = i.checked
      }

      if (i.getAttribute('data-conversion') == 'true') {
        // convert real units to svg units
        var conversion = config.getSync('scale')
        if (config.getSync('units') == 'mm') {
          conversion /= 25.4
        }
        val *= conversion
      }

      // add a spinner during saving to indicate activity
      i.parentNode.className = 'progress'

      config.setSync(key, val)
      var cfgvalues = config.getSync()
      window.DeepNest.config(cfgvalues)
      updateForm(cfgvalues)

      i.parentNode.className = ''

      if (key == 'units') {
        ractive.update('getUnits')
        ractive.update('dimensionLabel')
      }
    })
  })

  var setdefault = document.querySelector('#setdefault')
  setdefault.onclick = function (e) {
    // don't reset user profile
    var tempaccess = config.getSync('access_token')
    var tempid = config.getSync('id_token')
    config.resetToDefaultsSync()
    config.setSync('access_token', tempaccess)
    config.setSync('id_token', tempid)
    var cfgvalues = config.getSync()
    window.DeepNest.config(cfgvalues)
    updateForm(cfgvalues)
    return false
  }

  function saveJSON() {
    var filePath = window.api.remote.getGlobal('NEST_DIRECTORY') + 'exports.json'

    var selected = window.DeepNest.nests.filter(function (n) {
      return n.selected
    })

    if (selected.length == 0) {
      return false
    }

    var fileData = JSON.stringify(selected.pop())
    window.api.fs.writeFileSync(filePath, fileData)
  }

  function updateForm(c) {
    var unitinput
    if (c.units == 'inch') {
      unitinput = document.querySelector('#configform input[value=inch]')
    } else {
      unitinput = document.querySelector('#configform input[value=mm]')
    }

    unitinput.checked = true

    var labels = document.querySelectorAll('span.unit-label')
    Array.from(labels).forEach((l) => {
      l.innerText = c.units
    })

    var scale = document.querySelector('#inputscale')
    if (c.units == 'inch') {
      scale.value = c.scale
    } else {
      // mm
      scale.value = c.scale / 25.4
    }

    /*var scaledinputs = document.querySelectorAll('[data-conversion]');
				Array.from(scaledinputs).forEach(si => {
					si.value = c[si.getAttribute('data-config')]/scale.value;
				});*/

    var inputs = document.querySelectorAll('#config input, #config select')
    Array.from(inputs).forEach((i) => {
      var key = i.getAttribute('data-config')
      if (key == 'units' || key == 'scale') {
        return
      } else if (i.getAttribute('data-conversion') == 'true') {
        i.value = c[i.getAttribute('data-config')] / scale.value
      } else if (
        ['mergeLines', 'simplify', 'useSvgPreProcessor', 'useQuantityFromFileName'].includes(key)
      ) {
        i.checked = c[i.getAttribute('data-config')]
      } else {
        i.value = c[i.getAttribute('data-config')]
      }
    })
  }

  document.querySelectorAll('#config input, #config select').forEach(function (e) {
    e.onmouseover = function (event) {
      var inputid = e.getAttribute('data-config')
      if (inputid) {
        document.querySelectorAll('.config_explain').forEach(function (el) {
          el.className = 'config_explain'
        })

        var selected = document.querySelector('#explain_' + inputid)
        if (selected) {
          selected.className = 'config_explain active'
        }
      }
    }

    e.onmouseleave = function (event) {
      document.querySelectorAll('.config_explain').forEach(function (el) {
        el.className = 'config_explain'
      })
    }
  })

  // add spinner element to each form dd
  var dd = document.querySelectorAll('#configform dd')
  Array.from(dd).forEach((d) => {
    var spinner = document.createElement('div')
    spinner.className = 'spinner'
    d.appendChild(spinner)
  })

  // version info
  var version = document.querySelector('#package-version')
  version.innerText = pjson.version

  // part view
  Ractive.DEBUG = false

  var label = Ractive.extend({
    template: '{{label}}',
    computed: {
      label: function () {
        var width = this.get('bounds').width
        var height = this.get('bounds').height
        var units = config.getSync('units')
        var conversion = config.getSync('scale')

        // trigger computed dependency chain
        this.get('getUnits')

        if (units == 'mm') {
          return (
            (25.4 * (width / conversion)).toFixed(1) +
            'mm x ' +
            (25.4 * (height / conversion)).toFixed(1) +
            'mm'
          )
        } else {
          return (width / conversion).toFixed(1) + 'in x ' + (height / conversion).toFixed(1) + 'in'
        }
      }
    }
  })

  var ractive = new Ractive({
    el: '#homecontent',
    //magic: true,
    template: '#template-part-list',
    data: {
      parts: window.DeepNest.parts,
      imports: window.DeepNest.imports,
      getSelected: function () {
        var parts = this.get('parts')
        return parts.filter(function (p) {
          return p.selected
        })
      },
      getSheets: function () {
        var parts = this.get('parts')
        return parts.filter(function (p) {
          return p.sheet
        })
      },
      serializeSvg: function (svg) {
        return new XMLSerializer().serializeToString(svg)
      },
      partrenderer: function (part) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', part.bounds.width + 10 + 'px')
        svg.setAttribute('height', part.bounds.height + 10 + 'px')
        svg.setAttribute(
          'viewBox',
          part.bounds.x -
            5 +
            ' ' +
            (part.bounds.y - 5) +
            ' ' +
            (part.bounds.width + 10) +
            ' ' +
            (part.bounds.height + 10)
        )

        part.svgelements.forEach(function (e) {
          svg.appendChild(e.cloneNode(false))
        })
        return new XMLSerializer().serializeToString(svg)
      }
    },
    computed: {
      getUnits: function () {
        var units = config.getSync('units')
        if (units == 'mm') {
          return 'mm'
        } else {
          return 'in'
        }
      }
    },
    components: { dimensionLabel: label }
  })

  var mousedown = 0
  document.body.onmousedown = function () {
    mousedown = 1
  }
  document.body.onmouseup = function () {
    mousedown = 0
  }

  var update = function () {
    ractive.update('imports')
    applyzoom()
  }

  var throttledupdate = throttle(update, 500)

  var togglepart = function (part) {
    if (part.selected) {
      part.selected = false
      for (var i = 0; i < part.svgelements.length; i++) {
        part.svgelements[i].removeAttribute('class')
      }
    } else {
      part.selected = true
      for (var i = 0; i < part.svgelements.length; i++) {
        part.svgelements[i].setAttribute('class', 'active')
      }
    }
  }

  ractive.on('selecthandler', function (e, part) {
    //console.log(e, part)
    if (e.original.target.nodeName == 'INPUT') {
      return true
    }
    if (mousedown > 0 || e.original.type == 'mousedown') {
      togglepart(part)

      ractive.update('parts')
      throttledupdate()
    }
  })

  ractive.on('selectall', function (e) {
    var selected = window.DeepNest.parts.filter(function (p) {
      return p.selected
    }).length

    var toggleon = selected < window.DeepNest.parts.length

    window.DeepNest.parts.forEach(function (p) {
      if (p.selected != toggleon) {
        togglepart(p)
      }
      p.selected = toggleon
    })

    ractive.update('parts')
    ractive.update('imports')

    if (window.DeepNest.imports.length > 0) {
      applyzoom()
    }
  })

  // applies svg zoom library to the currently visible import
  const applyzoom = function () {
    if (window.DeepNest.imports.length > 0) {
      for (var i = 0; i < window.DeepNest.imports.length; i++) {
        if (window.DeepNest.imports[i].selected) {
          var pan, zoom
          if (window.DeepNest.imports[i].zoom) {
            pan = window.DeepNest.imports[i].zoom.getPan()
            zoom = window.DeepNest.imports[i].zoom.getZoom()
          } else {
            pan = false
            zoom = false
          }
          window.DeepNest.imports[i].zoom = svgPanZoom('#import-' + i + ' svg', {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            maxZoom: 50,
            minZoom: 0.1
          })

          if (zoom) {
            window.DeepNest.imports[i].zoom.zoom(zoom)
          }
          if (pan) {
            window.DeepNest.imports[i].zoom.pan(pan)
          }

          document
            .querySelector('#import-' + i + ' .zoomin')
            .addEventListener('click', function (ev) {
              ev.preventDefault()
              window.DeepNest.imports
                .find(function (e) {
                  return e.selected
                })
                .zoom.zoomIn()
            })
          document
            .querySelector('#import-' + i + ' .zoomout')
            .addEventListener('click', function (ev) {
              ev.preventDefault()
              window.DeepNest.imports
                .find(function (e) {
                  return e.selected
                })
                .zoom.zoomOut()
            })
          document
            .querySelector('#import-' + i + ' .zoomreset')
            .addEventListener('click', function (ev) {
              ev.preventDefault()
              window.DeepNest.imports
                .find(function (e) {
                  return e.selected
                })
                .zoom.resetZoom()
                .resetPan()
            })
        }
      }
    }
  }

  ractive.on('importselecthandler', function (e, im) {
    if (im.selected) {
      return false
    }

    window.DeepNest.imports.forEach(function (i) {
      i.selected = false
    })

    im.selected = true
    ractive.update('imports')
    applyzoom()
  })

  ractive.on('importdelete', function (e, im) {
    var index = window.DeepNest.imports.indexOf(im)
    window.DeepNest.imports.splice(index, 1)

    if (window.DeepNest.imports.length > 0) {
      if (!window.DeepNest.imports[index]) {
        index = 0
      }

      window.DeepNest.imports[index].selected = true
    }

    ractive.update('imports')

    if (window.DeepNest.imports.length > 0) {
      applyzoom()
    }
  })

  var deleteparts = function (e) {
    for (var i = 0; i < window.DeepNest.parts.length; i++) {
      if (window.DeepNest.parts[i].selected) {
        for (var j = 0; j < window.DeepNest.parts[i].svgelements.length; j++) {
          var node = window.DeepNest.parts[i].svgelements[j]
          if (node.parentNode) {
            node.parentNode.removeChild(node)
          }
        }
        window.DeepNest.parts.splice(i, 1)
        i--
      }
    }

    ractive.update('parts')
    ractive.update('imports')

    if (window.DeepNest.imports.length > 0) {
      applyzoom()
    }

    resize()
  }

  ractive.on('delete', deleteparts)
  document.body.addEventListener('keydown', function (e) {
    if (e.keyCode == 8 || e.keyCode == 46) {
      deleteparts()
    }
  })

  // sort table
  var attachSort = function () {
    var headers = document.querySelectorAll('#parts table thead th')
    Array.from(headers).forEach((header) => {
      header.addEventListener('click', function (e) {
        var sortfield = header.getAttribute('data-sort-field')

        if (!sortfield) {
          return false
        }

        var reverse = false
        if (this.className == 'asc') {
          reverse = true
        }

        window.DeepNest.parts.sort(function (a, b) {
          var av = a[sortfield]
          var bv = b[sortfield]
          if (av < bv) {
            return reverse ? 1 : -1
          }
          if (av > bv) {
            return reverse ? -1 : 1
          }
          return 0
        })

        Array.from(headers).forEach((h) => {
          h.className = ''
        })

        if (reverse) {
          this.className = 'desc'
        } else {
          this.className = 'asc'
        }

        ractive.update('parts')
      })
    })
  }

  // file import

  var files = window.api.fs.readdirSync(window.api.remote.getGlobal('NEST_DIRECTORY'))
  var svgs = files
    .map((file) => (file.includes('.svg') ? file : undefined))
    .filter((file) => file !== undefined)
    .sort()

  svgs.forEach(function (file) {
    processFile(window.api.remote.getGlobal('NEST_DIRECTORY') + file)
  })

  var importbutton = document.querySelector('#import')
  importbutton.onclick = function () {
    if (
      importbutton.className == 'button import disabled' ||
      importbutton.className == 'button import spinner'
    ) {
      return false
    }

    importbutton.className = 'button import disabled'

    window.api.remote.dialog
      .showOpenDialog({
        filters: [
          { name: 'CAD formats', extensions: ['svg', 'dxf'] },
          { name: 'SVG', extensions: ['svg'] },
          { name: 'DXF', extensions: ['dxf'] }
        ],
        properties: ['openFile', 'multiSelections']
      })
      .then((result) => {
        if (result.canceled) {
          importbutton.className = 'button import'
          console.log('No file selected')
        } else {
          importbutton.className = 'button import spinner'
          result.filePaths.forEach(function (file) {
            processFile(file)
          })
          importbutton.className = 'button import'
        }
      })
  }

  function processFile(file) {
    var ext = window.api.path.extname(file)
    var filename = window.api.path.basename(file)

    if (ext.toLowerCase() == '.svg') {
      readFile(file)
    } else {
      // send to conversion server
      var url = config.getSync('conversionServer')
      if (!url) {
        url = defaultConversionServer
      }

      const formData = new window.api.FormData()
      formData.append('fileUpload', window.api.fs.readFileSync(file), {
        filename: filename,
        contentType: 'application/dxf'
      })
      formData.append('format', 'svg')

      window.api.axios
        .post(url, formData.getBuffer(), {
          headers: {
            ...formData.getHeaders()
          },
          responseType: 'text'
        })
        .then((resp) => {
          const body = resp.data
          if (body.substring(0, 5) == 'error') {
            message(body, true)
          } else {
            // expected input dimensions on server is points
            // scale based on unit preferences
            var con = null
            var dxfFlag = false
            if (ext.toLowerCase() == '.dxf') {
              //var unit = config.getSync('units');
              con = Number(config.getSync('dxfImportScale'))
              dxfFlag = true
              console.log('con', con)

              /*if(unit == 'inch'){
									con = 72;
								}
								else{
									// mm
									con = 2.83465;
								}*/
            }

            // dirpath is used for loading images embedded in svg files
            // converted svgs will not have images
            if (config.getSync('useSvgPreProcessor')) {
              const svgResult = window.api.svgPreProcessor.loadSvgString(body)
              if (!svgResult.success) {
                message(svgResult.result, true)
              } else {
                importData(svgResult.result, filename, null, con, dxfFlag)
              }
            } else {
              importData(body, filename, null, con, dxfFlag)
            }
          }
        })
        .catch((err) => {
          message('could not contact file conversion server', true)
        })
    }
  }

  function readFile(filepath) {
    window.api.fs.readFile(filepath, 'utf-8', function (err, data) {
      if (err) {
        message('An error ocurred reading the file :' + err.message, true)
        return
      }
      var filename = window.api.path.basename(filepath)
      var dirpath = window.api.path.dirname(filepath)
      if (config.getSync('useSvgPreProcessor')) {
        const svgResult = window.api.svgPreProcessor.loadSvgString(data)
        if (!svgResult.success) {
          message(svgResult.result, true)
        } else {
          importData(svgResult.result, filename, null)
        }
      } else {
        importData(data, filename, dirpath, null)
      }
    })
  }

  function importData(data, filename, dirpath, scalingFactor, dxfFlag) {
    window.DeepNest.importsvg(filename, dirpath, data, scalingFactor, dxfFlag)

    window.DeepNest.imports.forEach(function (im) {
      im.selected = false
    })

    window.DeepNest.imports[window.DeepNest.imports.length - 1].selected = true

    ractive.update('imports')
    ractive.update('parts')

    attachSort()
    applyzoom()
    resize()
  }

  // part list resize
  var resize = function (event) {
    var parts = document.querySelector('#parts')
    var table = document.querySelector('#parts table')

    if (event) {
      parts.style.width = event.rect.width + 'px'
    }

    var home = document.querySelector('#home')

    var imports = document.querySelector('#imports')
    imports.style.width = home.offsetWidth - (parts.offsetWidth - 2) + 'px'
    imports.style.left = parts.offsetWidth - 2 + 'px'

    var headers = document.querySelectorAll('#parts table th')
    Array.from(headers).forEach((th) => {
      var span = th.querySelector('span')
      if (span) {
        span.style.width = th.offsetWidth + 'px'
      }
    })
  }

  interact('.parts-drag')
    .resizable({
      preserveAspectRatio: false,
      edges: { left: false, right: true, bottom: false, top: false }
    })
    .on('resizemove', resize)

  window.addEventListener('resize', function () {
    resize()
  })

  resize()

  // close message
  var messageclose = document.querySelector('#message a.close')
  messageclose.onclick = function () {
    document.querySelector('#messagewrapper').className = ''
    return false
  }

  // add sheet
  document.querySelector('#addsheet').onclick = function () {
    var tools = document.querySelector('#partstools')
    // var dialog = document.querySelector('#sheetdialog');

    tools.className = 'active'
  }

  document.querySelector('#cancelsheet').onclick = function () {
    document.querySelector('#partstools').className = ''
  }

  document.querySelector('#confirmsheet').onclick = function () {
    var width = document.querySelector('#sheetwidth')
    var height = document.querySelector('#sheetheight')

    if (Number(width.value) <= 0) {
      width.className = 'error'
      return false
    }
    width.className = ''
    if (Number(height.value) <= 0) {
      height.className = 'error'
      return false
    }

    var units = config.getSync('units')
    var conversion = config.getSync('scale')

    // remember, scale is stored in units/inch
    if (units == 'mm') {
      conversion /= 25.4
    }

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', 0)
    rect.setAttribute('y', 0)
    rect.setAttribute('width', width.value * conversion)
    rect.setAttribute('height', height.value * conversion)
    rect.setAttribute('class', 'sheet')
    svg.appendChild(rect)
    const sheet = window.DeepNest.importsvg(
      null,
      null,
      new XMLSerializer().serializeToString(svg)
    )[0]
    sheet.sheet = true

    width.className = ''
    height.className = ''
    width.value = ''
    height.value = ''

    document.querySelector('#partstools').className = ''

    ractive.update('parts')
    resize()
  }

  //var remote = require('remote');
  //var windowManager = app.require('electron-window-manager');

  /*const BrowserWindow = app.BrowserWindow;

			const path = require('path');
			const url = require('url');*/

  /*window.nestwindow = windowManager.createNew('nestwindow', 'Windows #2');
			nestwindow.loadURL('./main/nest.html');
			nestwindow.setAlwaysOnTop(true);
			nestwindow.open();*/

  /*window.nestwindow = new BrowserWindow({width: window.outerWidth*0.8, height: window.outerHeight*0.8, frame: true});

			nestwindow.loadURL(url.format({
				pathname: path.join(__dirname, './nest.html'),
				protocol: 'file:',
				slashes: true
				}));
			nestwindow.setAlwaysOnTop(true);
			nestwindow.webContents.openDevTools();
			nestwindow.parts = {wat: 'wat'};

			console.log(electron.window.electron.ipcRenderer.sendSync('synchronous-message', 'ping'));*/

  // clear cache
  var deleteCache = function () {
    var path = './nfpcache'
    if (window.api.fs.existsSync(path)) {
      window.api.fs.readdirSync(path).forEach(function (file, index) {
        var curPath = path + '/' + file
        if (window.api.fs.lstatSync(curPath).isDirectory()) {
          // recurse
          // TODO: this function does not exist, old code was commented out
          //deleteFolderRecursive(curPath)
        } else {
          // delete file
          window.api.fs.unlinkSync(curPath)
        }
      })
      //window.api.fs.rmdirSync(path);
    }
  }

  var startnest = function () {
    /*function toClipperCoordinates(polygon){
					var clone = [];
					for(var i=0; i<polygon.length; i++){
						clone.push({
							X: polygon[i].x*10000000,
							Y: polygon[i].y*10000000
						});
					}

					return clone;
				};

				function toNestCoordinates(polygon, scale){
					var clone = [];
					for(var i=0; i<polygon.length; i++){
						clone.push({
							x: polygon[i].X/scale,
							y: polygon[i].Y/scale
						});
					}

					return clone;
				};


				var Ac = toClipperCoordinates(window.DeepNest.parts[0].polygontree);
				var Bc = toClipperCoordinates(window.DeepNest.parts[1].polygontree);
				for(var i=0; i<Bc.length; i++){
					Bc[i].X *= -1;
					Bc[i].Y *= -1;
				}
				var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
				//console.log(solution.length, solution);

				var clipperNfp = toNestCoordinates(solution[0], 10000000);
				for(i=0; i<clipperNfp.length; i++){
					clipperNfp[i].x += window.DeepNest.parts[1].polygontree[0].x;
					clipperNfp[i].y += window.DeepNest.parts[1].polygontree[0].y;
				}
				//console.log(solution);
				cpoly = clipperNfp;

				//cpoly =  .calculateNFP({A: window.DeepNest.parts[0].polygontree, B: window.DeepNest.parts[1].polygontree}).pop();
				gpoly =  GeometryUtil.noFitPolygon(window.DeepNest.parts[0].polygontree, window.DeepNest.parts[1].polygontree, false, false).pop();

				var svg = window.DeepNest.imports[0].svg;
				var polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
				var polyline2 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');

				for(var i=0; i<cpoly.length; i++){
					var p = svg.createSVGPoint();
					p.x = cpoly[i].x;
					p.y = cpoly[i].y;
					polyline.points.appendItem(p);
				}
				for(i=0; i<gpoly.length; i++){
					var p = svg.createSVGPoint();
					p.x = gpoly[i].x;
					p.y = gpoly[i].y;
					polyline2.points.appendItem(p);
				}
				polyline.setAttribute('class', 'active');
				svg.appendChild(polyline);
				svg.appendChild(polyline2);

				ractive.update('imports');
				applyzoom();

				return false;*/

    for (var i = 0; i < window.DeepNest.parts.length; i++) {
      if (window.DeepNest.parts[i].sheet) {
        // need at least one sheet
        document.querySelector('#main').className = ''
        document.querySelector('#nest').className = 'active'

        var displayCallback = function () {
          // render latest nest if none are selected
          var selected = window.DeepNest.nests.filter(function (n) {
            return n.selected
          })

          // only change focus if latest nest is selected
          if (
            selected.length == 0 ||
            (window.DeepNest.nests.length > 1 && window.DeepNest.nests[1].selected)
          ) {
            window.DeepNest.nests.forEach(function (n) {
              n.selected = false
            })
            displayNest(window.DeepNest.nests[0])
            window.DeepNest.nests[0].selected = true
          }

          window.nest.update('nests')

          // enable export button
          document.querySelector('#export_wrapper').className = 'active'
          document.querySelector('#export').className = 'button export'
        }

        deleteCache()

        window.DeepNest.start(null, displayCallback.bind(window))
        return
      }
    }

    if (window.DeepNest.parts.length == 0) {
      message('Please import some parts first')
    } else {
      message('Please mark at least one part as the sheet')
    }
  }

  document.querySelector('#startnest').onclick = startnest

  var stop = document.querySelector('#stopnest')
  stop.onclick = function (e) {
    if (stop.className == 'button stop') {
      window.electron.ipcRenderer.send('background-stop')
      window.DeepNest.stop()
      document.querySelectorAll('li.progress').forEach(function (p) {
        p.removeAttribute('id')
        p.className = 'progress'
      })
      stop.className = 'button stop disabled'

      saveJSON()

      setTimeout(function () {
        stop.className = 'button start'
        stop.innerHTML = 'Start nest'
      }, 3000)
    } else if (stop.className == 'button start') {
      stop.className = 'button stop disabled'
      setTimeout(function () {
        stop.className = 'button stop'
        stop.innerHTML = 'Stop nest'
      }, 1000)
      startnest()
    }
  }

  var back = document.querySelector('#back')
  back.onclick = function (e) {
    setTimeout(function () {
      if (window.DeepNest.working) {
        window.electron.ipcRenderer.send('background-stop')
        window.DeepNest.stop()
        document.querySelectorAll('li.progress').forEach(function (p) {
          p.removeAttribute('id')
          p.className = 'progress'
        })
      }
      window.DeepNest.reset()
      deleteCache()

      window.nest.update('nests')
      document.querySelector('#nestdisplay').innerHTML = ''
      stop.className = 'button stop'
      stop.innerHTML = 'Stop nest'

      // disable export button
      document.querySelector('#export_wrapper').className = ''
      document.querySelector('#export').className = 'button export disabled'
    }, 2000)

    document.querySelector('#main').className = 'active'
    document.querySelector('#nest').className = ''
  }

  var exportbutton = document.querySelector('#export')

  var exportjson = document.querySelector('#exportjson')
  exportjson.onclick = saveJSON()

  var exportsvg = document.querySelector('#exportsvg')
  exportsvg.onclick = function () {
    var fileName = window.api.remote.dialog.showSaveDialogSync({
      title: 'Export deepnest SVG',
      filters: [{ name: 'SVG', extensions: ['svg'] }]
    })

    if (fileName === undefined) {
      console.log('No file selected')
    } else {
      var fileExt = '.svg'
      if (!fileName.toLowerCase().endsWith(fileExt)) {
        fileName = fileName + fileExt
      }

      var selected = window.DeepNest.nests.filter(function (n) {
        return n.selected
      })

      if (selected.length == 0) {
        return false
      }

      window.api.fs.writeFileSync(fileName, exportNest(selected.pop()))
    }
  }

  var exportdxf = document.querySelector('#exportdxf')
  exportdxf.onclick = function () {
    var fileName = window.api.remote.dialog.showSaveDialogSync({
      title: 'Export deepnest DXF',
      filters: [{ name: 'DXF', extensions: ['dxf'] }]
    })

    if (fileName === undefined) {
      console.log('No file selected')
    } else {
      var fileExt = '.dxf'
      var filePathExt = fileName
      if (!fileName.toLowerCase().endsWith(fileExt)) {
        fileName = fileName + fileExt
      }

      var selected = window.DeepNest.nests.filter(function (n) {
        return n.selected
      })

      if (selected.length == 0) {
        return false
      }
      // send to conversion server
      var url = config.getSync('conversionServer')
      if (!url) {
        url = defaultConversionServer
      }

      exportbutton.className = 'button export spinner'

      const formData = new window.api.FormData()
      formData.append('fileUpload', exportNest(selected.pop(), true), {
        filename: 'deepnest.svg',
        contentType: 'image/svg+xml'
      })
      formData.append('format', 'dxf')

      window.api.axios
        .post(url, formData.getBuffer(), {
          headers: {
            ...formData.getHeaders()
          },
          responseType: 'text'
        })
        .then((resp) => {
          const body = resp.data
          // function (err, resp, body) {
          exportbutton.className = 'button export'
          //if (err) {
          //	message('could not contact file conversion server', true);
          //} else {
          if (body.substring(0, 5) == 'error') {
            message(body, true)
          } else {
            window.api.fs.writeFileSync(fileName, body)
          }
          //}
        })
        .catch((err) => {
          message('could not contact file conversion server', true)
        })
    }
  }
  /*
			var exportgcode = document.querySelector('#exportgcode');
			exportgcode.onclick = function(){
				window.api.remote.dialog.showSaveDialog({title: 'Export deepnest Gcode'}, function (fileName) {
					if(fileName === undefined){
						console.log("No file selected");
					}
					else{
						var selected = window.DeepNest.nests.filter(function(n){
							return n.selected;
						});

						if(selected.length == 0){
							return false;
						}
						// send to conversion server
						var url = config.getSync('conversionServer');
						if(!url){
							url = defaultConversionServer;
						}

						exportbutton.className = 'button export spinner';

						var req = request.post(url, function (err, resp, body) {
							exportbutton.className = 'button export';
							if (err) {
								message('could not contact file conversion server', true);
							} else {
								if(body.substring(0, 5) == 'error'){
									message(body, true);
								}
								else{
									window.api.fs.writeFileSync(fileName, body);
								}
							}
						});

						var form = req.form();
						form.append('format', 'gcode');
						form.append('fileUpload', exportNest(selected.pop(), true), {
							filename: 'deepnest.svg',
							contentType: 'image/svg+xml'
						});
					}
				});
			};*/

  // nest save
  var exportNest = function (n, dxf) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    var svgwidth = 0
    var svgheight = 0

    // create elements if they don't exist, show them otherwise
    n.placements.forEach(function (s) {
      var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      svg.appendChild(group)
      /*DeepNest.parts[s.sheet].svgelements.forEach(function(e){
						var node = e.cloneNode(false);
						node.setAttribute('stroke', '#000');
						node.setAttribute('fill', 'none');
						group.appendChild(node);
					});*/

      var sheetbounds = window.DeepNest.parts[s.sheet].bounds

      group.setAttribute(
        'transform',
        'translate(' + -sheetbounds.x + ' ' + (svgheight - sheetbounds.y) + ')'
      )
      if (svgwidth < sheetbounds.width) {
        svgwidth = sheetbounds.width
      }

      s.sheetplacements.forEach(function (p) {
        var part = window.DeepNest.parts[p.source]
        var partgroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')

        part.svgelements.forEach(function (e, index) {
          var node = e.cloneNode(false)

          if (n.tagName == 'image') {
            var relpath = n.getAttribute('data-href')
            if (relpath) {
              n.setAttribute('href', relpath)
            }
            n.removeAttribute('data-href')
          }
          partgroup.appendChild(node)
        })

        group.appendChild(partgroup)

        // position part
        partgroup.setAttribute(
          'transform',
          'translate(' + p.x + ' ' + p.y + ') rotate(' + p.rotation + ')'
        )
        partgroup.setAttribute('id', p.id)
      })

      // put next sheet below
      svgheight += 1.1 * sheetbounds.height
    })

    var scale = config.getSync('scale')

    if (dxf) {
      scale /= Number(config.getSync('dxfExportScale')) // inkscape on server side
    }

    var units = config.getSync('units')
    if (units == 'mm') {
      scale /= 25.4
    }

    svg.setAttribute('width', svgwidth / scale + (units == 'inch' ? 'in' : 'mm'))
    svg.setAttribute('height', svgheight / scale + (units == 'inch' ? 'in' : 'mm'))
    svg.setAttribute('viewBox', '0 0 ' + svgwidth + ' ' + svgheight)

    if (config.getSync('mergeLines') && n.mergedLength > 0) {
      SvgParser.applyTransform(svg)
      SvgParser.flatten(svg)
      SvgParser.splitLines(svg)
      SvgParser.mergeOverlap(svg, 0.1 * config.getSync('curveTolerance'))
      SvgParser.mergeLines(svg)

      // set stroke and fill for all
      var elements = Array.prototype.slice.call(svg.children)
      elements.forEach(function (e) {
        if (e.tagName != 'g' && e.tagName != 'image') {
          e.setAttribute('fill', 'none')
          e.setAttribute('stroke', '#000000')
        }
      })
    }

    return new XMLSerializer().serializeToString(svg)
  }

  // nesting display

  var displayNest = function (n) {
    // create svg if not exist
    var svg = document.querySelector('#nestsvg')

    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('id', 'nestsvg')
      document.querySelector('#nestdisplay').innerHTML = new XMLSerializer().serializeToString(svg)
      svg = document.querySelector('#nestsvg')
    }

    // remove active class from parts and sheets
    document.querySelectorAll('#nestsvg .part').forEach(function (p) {
      p.setAttribute('class', 'part')
    })

    document.querySelectorAll('#nestsvg .sheet').forEach(function (p) {
      p.setAttribute('class', 'sheet')
    })

    // remove laser markers
    document.querySelectorAll('#nestsvg .merged').forEach(function (p) {
      p.remove()
    })

    var svgwidth = 0
    var svgheight = 0

    // create elements if they don't exist, show them otherwise
    n.placements.forEach(function (s) {
      var groupelement = document.querySelector('#sheet' + s.sheetid)
      if (!groupelement) {
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        group.setAttribute('id', 'sheet' + s.sheetid)
        group.setAttribute('data-index', s.sheetid)

        svg.appendChild(group)
        groupelement = document.querySelector('#sheet' + s.sheetid)

        window.DeepNest.parts[s.sheet].svgelements.forEach(function (e) {
          var node = e.cloneNode(false)
          node.setAttribute('stroke', '#ffffff')
          node.setAttribute('fill', 'none')
          node.removeAttribute('style')
          groupelement.appendChild(node)
        })
      }

      // reset class (make visible)
      groupelement.setAttribute('class', 'sheet active')

      var sheetbounds = window.DeepNest.parts[s.sheet].bounds
      groupelement.setAttribute(
        'transform',
        'translate(' + -sheetbounds.x + ' ' + (svgheight - sheetbounds.y) + ')'
      )
      if (svgwidth < sheetbounds.width) {
        svgwidth = sheetbounds.width
      }

      s.sheetplacements.forEach(function (p) {
        var partelement = document.querySelector('#part' + p.id)
        if (!partelement) {
          var part = window.DeepNest.parts[p.source]
          var partgroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          partgroup.setAttribute('id', 'part' + p.id)

          part.svgelements.forEach(function (e, index) {
            var node = e.cloneNode(false)
            if (index == 0) {
              node.setAttribute('fill', 'url(#part' + p.source + 'hatch)')
              node.setAttribute('fill-opacity', '0.5')
            } else {
              node.setAttribute('fill', '#404247')
            }
            node.removeAttribute('style')
            node.setAttribute('stroke', '#ffffff')
            partgroup.appendChild(node)
          })

          svg.appendChild(partgroup)

          if (!document.querySelector('#part' + p.source + 'hatch')) {
            // make a nice hatch pattern
            var pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern')
            pattern.setAttribute('id', 'part' + p.source + 'hatch')
            pattern.setAttribute('patternUnits', 'userSpaceOnUse')

            var psize = parseInt(window.DeepNest.parts[s.sheet].bounds.width / 120)

            psize = psize || 10

            pattern.setAttribute('width', psize)
            pattern.setAttribute('height', psize)
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.setAttribute(
              'd',
              'M-1,1 l2,-2 M0,' +
                psize +
                ' l' +
                psize +
                ',-' +
                psize +
                ' M' +
                (psize - 1) +
                ',' +
                (psize + 1) +
                ' l2,-2'
            )
            path.setAttribute(
              'style',
              'stroke: hsl(' +
                360 * (p.source / window.DeepNest.parts.length) +
                ', 100%, 80%) !important; stroke-width:1'
            )
            pattern.appendChild(path)

            groupelement.appendChild(pattern)
          }

          partelement = document.querySelector('#part' + p.id)
        } else {
          // ensure correct z layering
          svg.appendChild(partelement)
        }

        // reset class (make visible)
        partelement.setAttribute('class', 'part active')

        // position part
        partelement.setAttribute(
          'style',
          'transform: translate(' +
            (p.x - sheetbounds.x) +
            'px, ' +
            (p.y + svgheight - sheetbounds.y) +
            'px) rotate(' +
            p.rotation +
            'deg)'
        )

        // add merge lines
        if (p.mergedSegments && p.mergedSegments.length > 0) {
          for (var i = 0; i < p.mergedSegments.length; i++) {
            var s1 = p.mergedSegments[i][0]
            var s2 = p.mergedSegments[i][1]
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            line.setAttribute('class', 'merged')
            line.setAttribute('x1', s1.x - sheetbounds.x)
            line.setAttribute('x2', s2.x - sheetbounds.x)
            line.setAttribute('y1', s1.y + svgheight - sheetbounds.y)
            line.setAttribute('y2', s2.y + svgheight - sheetbounds.y)
            svg.appendChild(line)
          }
        }
      })

      // put next sheet below
      svgheight += 1.1 * sheetbounds.height
    })

    setTimeout(function () {
      document.querySelectorAll('#nestsvg .merged').forEach(function (p) {
        p.setAttribute('class', 'merged active')
      })
    }, 1500)

    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('viewBox', '0 0 ' + svgwidth + ' ' + svgheight)
  }

  window.nest = new Ractive({
    el: '#nestcontent',
    //magic: true,
    template: '#nest-template',
    data: {
      nests: window.DeepNest.nests,
      getSelected: function () {
        var ne = this.get('nests')
        return ne.filter(function (n) {
          return n.selected
        })
      },
      getNestedPartSources: function (n) {
        var p = []
        for (var i = 0; i < n.placements.length; i++) {
          var sheet = n.placements[i]
          for (var j = 0; j < sheet.sheetplacements.length; j++) {
            p.push(sheet.sheetplacements[j].source)
          }
        }
        return p
      },
      getColorBySource: function (id) {
        return 'hsl(' + 360 * (id / window.DeepNest.parts.length) + ', 100%, 80%)'
      },
      getPartsPlaced: function () {
        var ne = this.get('nests')
        var selected = ne.filter(function (n) {
          return n.selected
        })

        if (selected.length == 0) {
          return ''
        }

        selected = selected.pop()

        var num = 0
        for (var i = 0; i < selected.placements.length; i++) {
          num += selected.placements[i].sheetplacements.length
        }

        var total = 0
        for (i = 0; i < window.DeepNest.parts.length; i++) {
          if (!window.DeepNest.parts[i].sheet) {
            total += window.DeepNest.parts[i].quantity
          }
        }

        return num + '/' + total
      },
      getTimeSaved: function () {
        var ne = this.get('nests')
        var selected = ne.filter(function (n) {
          return n.selected
        })

        if (selected.length == 0) {
          return '0 seconds'
        }

        selected = selected.pop()

        var totalLength = selected.mergedLength

        var scale = config.getSync('scale')
        var lengthinches = totalLength / scale

        var seconds = lengthinches / 2 // assume 2 inches per second cut speed
        return millisecondsToStr(seconds * 1000)
      }
    }
  })

  window.nest.on('selectnest', function (e, n) {
    for (var i = 0; i < window.DeepNest.nests.length; i++) {
      window.DeepNest.nests[i].selected = false
    }
    n.selected = true
    window.nest.update('nests')
    displayNest(n)
  })

  // prevent drag/drop default behavior
  document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault()
  }

  document.body.ondrop = (ev) => {
    ev.preventDefault()
  }

  window.loginWindow = null
})

window.electron.ipcRenderer.on('background-progress', (event, p) => {
  /*var bar = document.querySelector('#progress'+p.index);
			if(p.progress < 0 && bar){
				// negative progress = finish
				bar.className = 'progress';
				bar.removeAttribute('id');
				return;
			}

			if(!bar){
				bar = document.querySelector('li.progress:not(.active)');
				bar.setAttribute('id', 'progress'+p.index);
				bar.className = 'progress active';
			}

			bar.querySelector('.bar').setAttribute('style', 'stroke-dashoffset: ' + parseInt((1-p.progress)*111));*/
  var bar = document.querySelector('#progressbar')
  bar.setAttribute(
    'style',
    'width: ' + parseInt(p.progress * 100) + '%' + (p.progress < 0.01 ? '; transition: none' : '')
  )
})

function message(txt, error) {
  var message = document.querySelector('#message')
  if (error) {
    message.className = 'error'
  } else {
    message.className = ''
  }
  document.querySelector('#messagewrapper').className = 'active'
  setTimeout(function () {
    message.className += ' animated bounce'
  }, 100)
  var content = document.querySelector('#messagecontent')
  content.innerHTML = txt
}

let _now =
  Date.now ||
  function () {
    return new Date().getTime()
  }

var throttle = function (func, wait, options) {
  var context, args, result
  var timeout = null
  var previous = 0
  options || (options = {})
  var later = function () {
    previous = options.leading === false ? 0 : _now()
    timeout = null
    result = func.apply(context, args)
    context = args = null
  }
  return function () {
    var now = _now()
    if (!previous && options.leading === false) previous = now
    var remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0) {
      clearTimeout(timeout)
      timeout = null
      previous = now
      result = func.apply(context, args)
      context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

function millisecondsToStr(milliseconds) {
  function numberEnding(number) {
    return number > 1 ? 's' : ''
  }

  var temp = Math.floor(milliseconds / 1000)
  var years = Math.floor(temp / 31536000)
  if (years) {
    return years + ' year' + numberEnding(years)
  }
  var days = Math.floor((temp %= 31536000) / 86400)
  if (days) {
    return days + ' day' + numberEnding(days)
  }
  var hours = Math.floor((temp %= 86400) / 3600)
  if (hours) {
    return hours + ' hour' + numberEnding(hours)
  }
  var minutes = Math.floor((temp %= 3600) / 60)
  if (minutes) {
    return minutes + ' minute' + numberEnding(minutes)
  }
  var seconds = temp % 60
  if (seconds) {
    return seconds + ' second' + numberEnding(seconds)
  }

  return '0 seconds'
}
