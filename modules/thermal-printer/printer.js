const characterSet = {
  USA: 0,
  France: 1, 
  Germany: 2, 
  England: 3, 
  Denmark_I: 4, 
  Sweden: 5, 
  Italy: 6, 
  Spain_I: 7, 
  Japan: 8, 
  Norway: 9, 
  Denmark_II: 10, 
  Spain_II: 11, 
  Latin_America: 12, 
  Korea: 13
}
const thermalPrinterPort = 'COM5' 
const SerialPort = require('serialport')
const thermalPrinter = new SerialPort(thermalPrinterPort, {
  baudRate: 19200
})

let buffer = null
// ------------------------------ Append ------------------------------
let append = function(buff){
  if(typeof buff === "string"){

    let endBuff = null
    for(let i=0; i<buff.length; i++) {
      let value = buff[i]
      let tempBuff = new Buffer(value)

      if (endBuff) endBuff = Buffer.concat([endBuff, tempBuff])
      else endBuff = tempBuff
    }

    buff = endBuff
  }

  // Append new buffer
  if (buffer) {
    buffer = Buffer.concat([buffer,buff])
  } else {
    buffer = buff
  }
}

const ascii = require('./ascii.buff')

module.exports = {
  println: (text) => {
    append(text.toString())
    // append("\n")
    append(ascii.LF)
    thermalPrinter.write(buffer)
    buffer = null
  },
  characterSet: characterSet,
  setCharacterSet: (charSet) => {
    buffer = null
    // string sCommand = AsciiCode.ESC + (char)'R' + (int)iso;
    console.log('charset', charSet)
    // append(new Buffer([ascii.ESC,'R'.charCodeAt(0), charSet]))
    append(new Buffer([0x1b, 0x52, charSet]))
    thermalPrinter.write(buffer)

  },
  setFontAlign: (iAlign) => {
    buffer = null
    // append(ascii.TXT_ALIGN_CT)
    // append(new Buffer([ascii.ESC, 'a'.charCodeAt(0), Number(iAlign)]))
    append(new Buffer([0x1b, 0x61, iAlign]))
    thermalPrinter.write(buffer)
  },
  setExtendMode: (iMode) => {
    buffer = null
    append(new Buffer([0x1a, 0x78, iMode]))
    thermalPrinter.write(buffer)
  },
  PartialCut:() => {
    buffer = null
    append(new Buffer([0x1b, 0x69]))
    thermalPrinter.write(buffer)
  },
  Fullcut:() => {
    buffer = null
    append(new Buffer([0x1b, 0x6d]))
    thermalPrinter.write(buffer)
  }
  

}
