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

const Iconv = require('iconv').Iconv
const jschardet = require('jschardet');

/*
console.log('thermalPrinter.isOpen', thermalPrinter.isOpen)

if (thermalPrinter.isOpen) {
  const parser = new Readline();
  thermalPrinter.pipe(parser);
  parser.on('data', console.log);
}
*/

let buffer = null
// ------------------------------ Append ------------------------------
let append = function(buff){
  if(typeof buff === "string"){
    // const sEncoding = jschardet.detect(buff)
    // console.log(buff, sEncoding)
    

    let endBuff = null;
    for(var i=0; i<buff.length; i++) {
      const value = buff[i];
      // const tempBuff = new Buffer(value);
      const tempBuff = Buffer.from(value)
      

      if (endBuff) endBuff = Buffer.concat([endBuff, tempBuff]);
      else endBuff = tempBuff;
    }

    buff = endBuff;
  }  
  /*
  if(typeof buff === "string"){

    let endBuff = null
    // let utf8 = unescape(encodeURIComponent(buff))
    let utf8 = buff

    for(let i=0; i<utf8.length; i++) {
      // let value = utf8.charCodeAt(i).toString(16)
      // let tempBuff = new Buffer(value, 'ascii')
      // console.log(utf8[i], value)
      // let tempBuff = Buffer.from(value, 'hex')
      console.log('append', tempBuff)

      if (endBuff) endBuff = Buffer.concat([endBuff, tempBuff])
      else endBuff = tempBuff
    }

    buff = endBuff
  }
  */

  // Append new buffer
  if (buffer) {
    buffer = Buffer.concat([buffer,buff])
  } else {
    buffer = buff
  }
}

const ascii = require('./ascii.buff')
const iconv = new Iconv('ASCII', 'CP949');

module.exports = {
  println: (text) => {
    if (text) {
      // console.log(text, jschardet.detect(text))
      append(text.toString())
      append(ascii.LF)
      thermalPrinter.write(buffer)
    }
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
  set2ByteModeEnable: () => {
    buffer = null
    append(new Buffer([0x1c, 0x26]))
    thermalPrinter.write(buffer)
  },
  set2ByteModeDisable: () => {
    buffer = null
    append(new Buffer([0x1c, 0x2e]))
    thermalPrinter.write(buffer)
  },  
  partialCut:() => {
    buffer = null
    append(new Buffer([0x1b, 0x69]))
    thermalPrinter.write(buffer)
  },
  fullcut:() => {
    buffer = null
    append(new Buffer([0x1b, 0x6d]))
    thermalPrinter.write(buffer)
  }
  
}
