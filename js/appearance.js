;(function () {
  var root = document.documentElement
  var ATTRIBUTE = 'data-kd-appearance'

  function currentMode() {
    return root.getAttribute(ATTRIBUTE) || 'auto'
  }

  function wireSwitch(input) {
    input.checked = input.value === currentMode()
    input.addEventListener('change', function () {
      if (input.value === 'auto') root.removeAttribute(ATTRIBUTE)
      else root.setAttribute(ATTRIBUTE, input.value)
      try {
        localStorage.setItem('kd-appearance', input.value)
      } catch {
        // storage unavailable: the choice applies to this page only
      }
    })
  }

  function wireLift(element) {
    var threshold = parseInt(element.getAttribute('data-kd-lift'), 10)
    if (isNaN(threshold)) threshold = 24
    function update() {
      if (window.scrollY > threshold) element.setAttribute('data-lifted', '')
      else element.removeAttribute('data-lifted')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
  }

  function init() {
    document.querySelectorAll('input[name="kd-appearance"]').forEach(wireSwitch)
    document.querySelectorAll('[data-kd-lift]').forEach(wireLift)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
