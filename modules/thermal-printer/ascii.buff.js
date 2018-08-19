module.exports = {
    NUL: new Buffer([0x00]), // null
    SOH: new Buffer([0x01]), // start of header
    STX: new Buffer([0x02]), // start of text
    ETX: new Buffer([0x03]), // end of text
    EOT: new Buffer([0x04]), // end of transmission
    ENQ: new Buffer([0x05]), // enquiry
    ACK: new Buffer([0x06]), // acknowledge
    BEL: new Buffer([0x07]), // bell
    BS: new Buffer([0x08]), // backspace
    HT: new Buffer([0x09]), // horizontal tab
    LF: new Buffer([0x0A]), // line feed
    VT: new Buffer([0x0B]), // vertical tab
    FF: new Buffer([0x0C]), // form feed
    CR: new Buffer([0x0D]), // enter / carriage return
    SO: new Buffer([0x0E]), // shift out
    SI: new Buffer([0x0F]), // shift in
    DLE: new Buffer([0x10]), // data link escape
    DC1: new Buffer([0x11]), // device control 1
    DC2: new Buffer([0x12]), // device control 2
    DC3: new Buffer([0x13]), // device control 3
    DC4: new Buffer([0x14]), // device control 4
    NAK: new Buffer([0x15]), // negative acknowledge
    SYN: new Buffer([0x16]), // synchronize
    ETB: new Buffer([0x17]), // end of trans.block
    CAN: new Buffer([0x18]), // cancel
    EM: new Buffer([0x19]), // end of medium
    SUB: new Buffer([0x1A]), // substitute
    ESC: new Buffer([0x1B]), // escape
    FS: new Buffer([0x1C]), // file separator
    GS: new Buffer([0x1D]), // group separator
    RS: new Buffer([0x1E]), // record separator
    US: new Buffer([0x1F]), // unit separator
    DEL: new Buffer([0x7F]), // delete
    TXT_ALIGN_LT: new Buffer([0x1b, 0x61, 0x00]), // Left justification
    TXT_ALIGN_CT: new Buffer([0x1b, 0x61, 0x01]), // Centering
    TXT_ALIGN_RT: new Buffer([0x1b, 0x61, 0x02]), // Right justification
}
