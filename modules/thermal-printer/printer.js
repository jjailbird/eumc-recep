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
const thermalPrinterPort = 'COM3' 
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
  setCharacterSet: (characterSet) => {
    
  },
  setFontAlign: (iAlign) => {
    buffer = null
    append(ascii.TXT_ALIGN_CT)
    thermalPrinter.write(buffer)
  }
  

}
