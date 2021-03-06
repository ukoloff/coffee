!function(){

var
  versions = [],
  editors = {},
  popup, error, errPos,
  compiler, compilers = {}
  minifyOptions = {    
    parse: {
      bare_returns: true
    },
    output: {
      max_line_len: 72
    }
  }

setTimeout(boot, 100)

this.define = function(vs)
{
  versions = vs
}

function boot()
{
  reDefine()
  splitter(50)
  initEditors()
  initPopup()
  initError()
}

function reDefine()
{
  this.define = loaded
  loaded.amd = true
}

function initEditors()
{
  var z = document.getElementsByTagName('pre')
  for(var i = z.length-1; i>=0; i--)
  {
    var id = z[i].id
    var x = editors[id] = ace.edit(z[i])
    x.setTheme("ace/theme/github")
    x.getSession().setMode("ace/mode/"+id)
    x.getSession().setUseWorker(false)
    x.on('focus', hidePopup)
  }
  editors.coffee.getSession().on('change', thenCompile)
  editors.coffee.focus()
}

function initPopup()
{
  var z = document.getElementById('options')
  popup = z.getElementsByTagName('div')[0]
  z.getElementsByTagName('input')[0].onclick=function()
  {
    popup.style.display = 'block'
  }
  popup.getElementsByTagName('a')[0].onclick = hidePopup
  z=popup.getElementsByTagName('select')[0]
  var s=''
  for(var i = 0; i<versions.length; i++)
  {
    var x = document.createElement("option")
    x.text=versions[i]
    z.add(x)
  }
  z.onchange=select
  select.call(z)
  z = popup.getElementsByTagName('input')
  for(i = z.length-1; i>=0; i--)
    z[i].onclick = thenCompile
}

function hidePopup()
{
  if(popup)
    popup.style.display=''
  return false
}

function initError()
{
  error = document.getElementById('error')
  error.getElementsByTagName('a')[0].onclick = hideError
  error.getElementsByTagName('input')[0].onclick = go2err
}

function showError(e)
{
  editors.javascript.setValue(errorify(e.message))
  error.style.display = 'block'
  error.children[1].innerHTML = html(e.message)
  errPos = e.location ? {
    x: e.location.first_column,
    y: e.location.first_line
  } : null
  error.getElementsByTagName('input')[0].style.display = errPos ? '' : 'none'
}

function hideError()
{
  error.style.display = ''
  return false
}

function go2err(){
  editors.coffee.navigateTo(errPos.y, errPos.x)
  editors.coffee.focus()
}

function select()
{
  var v = versions[this.selectedIndex]
  if(compilers[v])
  {
    compiler = compilers[v]
    thenCompile()
    return
  }
  addScript(v)
}

function addScript(version)
{
  var js = document.createElement('script')
  js.src = 'js/'+version+'/coffee-script.js'
  document.getElementsByTagName('head')[0].appendChild(js)
}

function loaded(coffee)
{
  if(1!=arguments.length) return
  if('function'==typeof coffee)
    coffee = coffee()
  compilers[coffee.VERSION] = compiler = coffee
  thenCompile()
}

function thenCompile()
{
  if(compiler)
    setTimeout(compile)
}

function getOptions()
{
  var
    r = {},
    checkBoxes = popup.getElementsByTagName('input')

  for(var i = checkBoxes.length-1; i>=0; i--)
  {
    var cb = checkBoxes[i]
    r[cb.name] = cb.checked
  }
  return r
}

function compile()
{
  var
    Options=getOptions()

  hideError()

  try
  {
    var js = compiler.compile(editors.coffee.getValue(), {
      bare: !Options.bare,
      header: Options.header
    })
    if(Options.minify)
      js = UglifyJS.minify(js, minifyOptions).code || js
    editors.javascript.setValue(js)
    editors.javascript.getSession().setUseWrapMode(Options.minify)
  }
  catch(e)
  {
    showError(e)
  }
}

function errorify(msg)
{
  var x = String(msg).split(/\r?\n|\r/)
  for(var i = x.length-1; i>=0; i--)
    x[i] = '//# '+x[i]
  return x.join('\n')
}

function splitter(percent) {
  var z = document.getElementById('splitter')
  moveTo(percent)
  z.onmousedown = function() {
    if(z.className)
      return
    var debounce, preserve = {move: move, down: swap}
    setTimeout(swap)

    function move(e) {
      if (!debounce)
        setTimeout(fire, 100)
      debounce = [(e || window.event).clientX]
      return false

      function fire() {
        moveTo(Math.min(90, Math.max(10, Math.round(debounce[0] / z.offsetParent.clientWidth * 100))))
        debounce = false
      }
    }

    function swap(e) {
      z.className = z.className ? '' : 'on';
      for (var k in preserve) {
        var v = preserve[k], name = "onmouse" + k
        preserve[k] = document[name]
        document[name] = v
      }
      return false
    }
    return false
  }

  function moveTo(percent) {
    z.style.left = percent + '%'
    divs = z.parentNode.children
    style = divs[0].style
    style.left = 0
    style.width = percent + '%'
    style = divs[1].style
    style.width = (100-percent) + '%'
    style.right = 0
    for(var k in editors) {
      editors[k].resize()
    }
  }
}

var htmls = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}

function html(s)
{
  return String(s).replace(/[&<>"]/g, function(e){return htmls[e]})
}

// ES6: Patches for CoffeeScript 1.9.0+ on Windows
if(!Object.create)
  Object.create = function(proto) {
    function create(){}
    create.prototype = proto
    return new create
  }

if(!Object.assign)
  Object.assign = function(target) {
    var target = Object(target)
    for (var i = 1; i <= arguments.length; i++) {
      var src = Object(arguments[i])
      for (var k in src) 
        target[k] = src[k]
    }
    return target
  }

}()
