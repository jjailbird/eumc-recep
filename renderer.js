// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const dials = document.querySelectorAll('button[data-number]')
const numInfo = document.getElementById('numInfo')
const btnClear = document.getElementById('btnClear')
const btnConfirm = document.getElementById('btnConfirm')
const popup = document.getElementById('popup')
const portSelector = document.getElementById('port_selector')
const popup_prevent_input = document.getElementById('popup_prevent_input') 

const eumc_soap = require('./modules/eumc/eumc-soap')
const shutdown = require('electron-shutdown-command');

let scanPort = 'COM4'

// window.$ = window.jQuery = require('jquery')
// window.Bootstrap = require('bootstrap')

Array.from(dials).forEach(dial => {
  dial.addEventListener('click', function(event) {
    numInfo.value += this.dataset.number
    console.log('dial')
  })
})

btnClear.addEventListener('click', function(event) {
  // numInfo.value = ""
  let number_string = numInfo.value
  if(number_string.length > 0) {
    numInfo.value = number_string.slice(0, -1)
    console.log(number_string)
  }
  // portSelector.style.display = 'block'
})


/*
popup.addEventListener('click', function(event) {
  popup.style.display = 'none'
})
*/

// Importing this adds a right-click menu with 'Inspect Element' option -------------------------
const remote = require('electron').remote
const Menu = remote.Menu
const MenuItem = remote.MenuItem

let rightClickPosition = null

const mu = new Menu()
const mi = new MenuItem({
  label: 'Inspect Element',
  click: () => {
    remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
  }
})
mu.append(mi)

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  rightClickPosition = {x: e.x, y: e.y}
  mu.popup(remote.getCurrentWindow())
}, false)
// -----------------------------------------------------------------------------------------------

// Serial Port -----------------------------------------------------------------------------------
const SerialPort = require('serialport')
const Readline = SerialPort.parsers.Readline
const scanner = new SerialPort(scanPort)

const parser = new Readline()
scanner.pipe(parser)
parser.on('data', readScanData)

function readScanData(data) {
  console.log('data:', "[" + data + "]")
  numInfo.value = data
  eumc_soap.getReservation(data)
}

let buffer = null

btnConfirm.addEventListener('click', function(event) {
  // popup.style.display = 'block'
  popup_prevent_input.style.display = 'block'
  console.log('getPatientInfo by', numInfo.value)
  eumc_soap.getPatientInfo(numInfo.value)
  eumc_soap.getWaitingNumbers();
})

function toHex(str) {
	var hex = '';
	for(var i=0;i<str.length;i++) {
		hex += ''+str.charCodeAt(i);
	}
	return hex;
}

const reset_server = require('./modules/rest/app')

// -----------------------------------------------------------------------------------------------

// Check holiday and system shut down
eumc_soap.getIsHoliday().then((result) => {
  console.log(result)
}).catch((err) => {
  console.log(err)
})