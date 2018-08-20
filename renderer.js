// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const dials = document.querySelectorAll('button[data-number]')
const numInfo = document.getElementById('numInfo')
const btnClear = document.getElementById('btnClear')
const btnConfirm = document.getElementById('btnConfirm')
const popup = document.getElementById('popup')
const portSelector = document.getElementById('port_selector')

let scanPort = 'COM4'

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
  portSelector.style.display = 'block'
})

popup.addEventListener('click', function(event) {
  popup.style.display = 'none'
})

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
/*
const printer = new SerialPort(printerPort, {
  baudRate: 19200
})
*/

const ascii = require('./modules/thermal-printer/ascii.buff')
const printer = require('./modules/thermal-printer/printer')
const parser = new Readline()
scanner.pipe(parser)
parser.on('data', readScanData)

function readScanData(data) {
  console.log('data:', data)
  numInfo.value = data
}


let buffer = null

btnConfirm.addEventListener('click', function(event) {
  // alert('print!!!')
  
  //printer.write(ascii.ESC + 'a' + 1)
  //console.log(ascii.ESC + 'a' + 1)
  // printer.write('PRINT!!!' + ascii.LF)
  // printer.write(Buffer.concat(['PRINTTTTTTTT!!!',ascii.LF]))
  // printer.write('한글 테스트 한글 테스트' + ascii.LF)
  printer.setFontAlign(1)
  printer.println('PRINT TEST !!!')
  popup.style.display = 'block'

  
})
// -----------------------------------------------------------------------------------------------


// Thermal Printer -------------------------------------------------------------------------------
/*
const thermalPrinter = require('./modules/node-thermal-printer')

thermalPrinter.init({
  type: 'epson',
  interface: 'COM3'
})
btnConfirm.addEventListener('click', function(event) {
  alert('print!!!')
  thermalPrinter.println('PRINT!!!')
})
*/
// -----------------------------------------------------------------------------------------------