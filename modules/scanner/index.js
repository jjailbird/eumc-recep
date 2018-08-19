const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM4');
const parser = new Readline();
port.pipe(parser);
parser.on('data', console.log);
//port.write('ROBOT PLEASE RESPOND\n');
