const {ipcRenderer} = require('electron')
const soap = require('soap')
const convert = require('xml-js')
const util = require('util')

const test_url1 = 'http://esysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url2 = 'http://devensysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url3 = 'http://www.holidaywebservice.com//HolidayService_v2/HolidayService2.asmx?wsdl'

const xConvert = require('xml-js');
// const printer = require('../thermal-printer/printer')
// const ascii = require('../thermal-printer/ascii.buff')
// import printer from '../thermal-printer/printer'
// import * as ascii from '../thermal-printer/ascii.buff'
// import SimpleWSocket from '../websocket'
const SimpleWSocket = require('../websocket')

const wsocket = new SimpleWSocket('ws://localhost:8181')
wsocket.isreconnect = true
wsocket.connect()

wsocket.onmessage = function(message) {
  console.log(message)
}

const txtWaitingNumbers = document.getElementById('txtWaitingNumbers')
const popup = document.getElementById('popup') 
const popup_content = document.getElementById('popup_content')
const popup_confirm = document.getElementById('popup_confirm')
const confirm_content = document.getElementById('confirm_content')
const confirm_title = document.getElementById('confirm_title')
const confirm_pno = document.getElementById('confirm_pno')
const confirm_pname = document.getElementById('confirm_pname')
const btn_confirm_ok = document.getElementById('btn_confirm_ok')
const btn_confirm_canncel = document.getElementById('btn_confirm_cancel')
const txt_search_number = document.getElementById('numInfo')
const popup_prevent_input = document.getElementById('popup_prevent_input')

const sound_do_apply = new Sound("assets/audio/번호가 호출되면 접수하세요.mp3",100,false);
const sound_go_reception = new Sound("assets/audio/수납 후 접수대로 오세요.mp3",100,false);
const sound_wating_blood = new Sound("assets/audio/채혈실 안에서 대기하세요. 번호가 호출되면 채혈하세요.mp3",100,false);

let prevent_input = false

btn_confirm_canncel.addEventListener('click', function(event) {
  closeConfirmWindow()
})
btn_confirm_ok.addEventListener('click', function(event){
  const ptnum = confirm_title.innerText
  if(!isNaN(ptnum)) {
    getReservationInfo(ptnum)
  }
})

function openConfirmWindow(content, ptnum) {
  popup_prevent_input.style.display = 'none'
  confirm_title.innerText = ptnum
  confirm_content.innerHTML = content
  popup_confirm.style.display = 'block'

}

function closeConfirmWindow() {
  popup_confirm.style.display = 'none'
}

function openPopupWindow(content, type) {
  popup_prevent_input.style.display = 'none'
  popup_content.innerHTML = content
  popup.style.display = 'block'
  setTimeout(function() {
    popup.style.display = 'none'
    // if (type == 'invalid_number') {
      txt_search_number.value = ""
    //}
  
  }, 2000)
}

async function sound_demo() {
  let sound_play = sound_do_apply
  sound_play.start()
  await sleep(5000)

  sound_play = sound_go_reception
  sound_play.start()
  await sleep(5000)

  sound_play = sound_wating_blood
  sound_play.start()
}


function changeWaitingNumbers(sNumber) {
  console.log('change', sNumber)
  txtWaitingNumbers.innerText = sNumber
}

function getReservationInfo(sNumber) {
  
  sNumber = sNumber.trim()
  console.log('getReservationInfo', sNumber, sNumber.length)
  if (sNumber && (sNumber.length == 8)) {
    let popup_message = ""
    let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_BLCL_KIOSK_SELECT]]> </QID><QTYPE> <![CDATA[Package]]> </QTYPE><USERID> <![CDATA[RTE]]>  </USERID>  <EXECTYPE>  <![CDATA[FILL]]>  </EXECTYPE>   <P0>  <![CDATA[02]]>  </P0>  <P1>  <![CDATA[%s]]>  </P1></Table>"
    let sParam = ""
    let pn = sNumber
    let sound_play = null

    sParam = util.format(sQuery, pn)

    soap.createClient(test_url2, function(err, client) {
      const args = {
        sGubun: 'GETQUERY',
        sParam: sParam
      }
      
      client.LMService(args, function(err, result) {
        console.log('getReservationInfo', result)
        if(result.LMServiceResult) {
          const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
          if (xData.NewDataSet.Table) {
            const xxData = xData.NewDataSet.Table
            
            let itemCount = Array.isArray(xxData) ? xxData.length : 1
            let bAcceptFull = true
            
            console.log('itemCount',itemCount)
            let cData = null
            if (Array.isArray(xxData)) {

              for(let i = 0;i<xxData.length; i++) {
                // console.log(i, xxData[i])
                cData = xxData[i]
  
                if (cData.RPY_STS_CD._text == 'N') {
                  bAcceptFull = false
                  break
                }
              }
  
            } 
            else {
              cData = xxData
              if (cData.RPY_STS_CD._text == 'N') {
                bAcceptFull = false
              }
        
            }
            
            if (itemCount == 0) {
              popup_message = "예정된 진료가 없습니다."
            } 
            else if (itemCount == 1 && bAcceptFull == true) {
              setAutoBloodCollection(cData.PT_NO._text, cData.EXM_HOPE_DT._text, cData.PT_NM._text)
              console.log('setAutoBloodCollection', cData)
              // popup_message = "채혈실 안에서 대기하세요. 번호가 호출되면 채혈하세요."
              // sound_play = sound_wating_blood
            }
            else {
              setWaitingNumber(sNumber, cData.PT_NM._text)    
              if (bAcceptFull == false) {
                popup_message = "수납 후 접수대로 오세요."
                for(let i = 0;i<xxData.length; i++) {
                  const cData = xxData[i]
    
                  if (cData.RPY_STS_CD._text == 'N') {
                    let popup_message_ = "환자명:%s<br/>진료과명:%s<br/>주치의 의사명:%s<br/>진료희망일자:%s<br/>수납 후 접수대로 오세요." 
                    popup_message = util.format(popup_message_, cData.PT_NM._text, cData.DEPT_NM._text, cData.ANDR_STF_NM._text, cData.EXM_HOPE_DT._text)
                    sound_play = sound_go_reception
                    break
                  }
                }
              }  
              else {
                popup_message = "번호가 호출되면 접수하세요." // "접수대 앞에서 대기하세요. 번호가 호출됩니다"
                sound_play = sound_do_apply
              }
              
            }

            if (popup_message != "") {
              closeConfirmWindow()
              openPopupWindow(popup_message)
            }
            if (sound_play) {
              sound_play.start()
              
            }
            
          }
          else {
            openPopupWindow("접수대에서 문의하세요.")
          }
        }
      })
      
    })
  }
  else {
    openPopupWindow("올바른 조회 번호를 입력하시오")      
  }

}

function setWaitingNumber(sNumber, pName) {
    
  if (sNumber && (sNumber.length == 8)) {
    let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_INS_KIOSK_WAITNO]]> </QID><QTYPE> <![CDATA[Package]]> </QTYPE><USERID> <![CDATA[RTE]]>  </USERID>  <EXECTYPE>  <![CDATA[FILL]]>  </EXECTYPE>   <P0>  <![CDATA[02]]>  </P0>  <P1>  <![CDATA[%s]]>  </P1></Table>"
    let sParam = ""
    let pn = sNumber
    sParam = util.format(sQuery, pn)

    console.log('sParam', sParam)
    
    soap.createClient(test_url2, function(err, client) {
      const args = {
        sGubun: 'SETQUERY',
        sParam: sParam
      }
     
      client.LMService(args, function(err, result) {
        if(result.LMServiceResult) {
          const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
          // console.log('xData', xData)
          if(xData.NewDataSet.Table) {
            const xxData = xData.NewDataSet.Table
            // console.log('xxData', xxData)
            const checkNum = xxData.Return.Value._text
            console.log('setWaitingNumber',xxData.Return.Value._text)
            if (checkNum == "0000")
              openPopupWindow("접수대에 문의하세요.")
            else             
              printWaitingNumber(xxData.Return.Value._text,sNumber, pName, 'RECEIPT')
       
          }
        }
      })
      
    })
  }
  else {
    openPopupWindow('올바른 조회 번호를 입력하시오')      
  }
}

function setAutoBloodCollection(sNumber, sHopeDate, sPtName) {
    
  if (sNumber && (sNumber.length == 8) && sHopeDate) {
    let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_INS_KIOSK_ACCEPT]]></QID><QTYPE><![CDATA[Package]]></QTYPE><USERID><![CDATA[RTE]]></USERID><EXECTYPE><![CDATA[FILL]]></EXECTYPE><P0><![CDATA[02]]></P0><P1><![CDATA[%s]]></P1><P2><![CDATA[%s]]></P2></Table>"
    let sParam = ""
    let pn = sNumber

    sParam = util.format(sQuery, pn, sHopeDate)

    soap.createClient(test_url2, function(err, client) {
      const args = {
        sGubun: 'SETQUERY',
        sParam: sParam
      }
      
      // LMService Result >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 
      client.LMService(args, function(err, result) {
        if(result.LMServiceResult) {
          
          const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
          console.log('check blood', xData.NewDataSet.Table)
          if(xData.NewDataSet.Table) {
            const xxData = xData.NewDataSet.Table
            const checkBloodNum = xxData.Return.Value._text
            
            if (checkBloodNum == "0000") {
              openPopupWindow("이미 번호표를 발급 받으셨습니다.")
            }
            else {
              openPopupWindow("채혈실 안에서 대기하세요. 번호가 호출되면 채혈하세요.")
              sound_wating_blood.start()
              printWaitingNumber(checkBloodNum,sPtName,sNumber, 'blood')
            }
            

          }
        }
      })
      // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LMService Result
    })
  }
  else {
    console.log('err','올바른 조회 번호를 입력하시오')      
  }

}

function printWaitingNumber(wNumber, pName, pNumber, type) {
  let oMessage = {}
  oMessage.device = "thermalPrinter"
  oMessage.command = "print_waitingNumber"
  
  oMessage.waitingNumber = wNumber
  if (type === 'blood')
    oMessage.title = "채혈하실 분"
  else
    oMessage.title = "접수하실 분"

  oMessage.waitingNumber = wNumber
  oMessage.patientName = pName
  oMessage.patientNumber = pNumber
  if (type === 'blood') {
    oMessage.contents1 = "채혈 후 5분 이상";
    oMessage.contents2 = "눌러주세요.";
  }
  else {
    oMessage.contents1 = "접수실에서 기다려주세요.";
    oMessage.contents2 = "";
  }
  // oMessage.printDateTime;
  oMessage.footer = "이화여자대학교 목동병원 진단검사의학과";

  const sMessage = JSON.stringify(oMessage)
  console.log('wsocket.isconnected', wsocket.isconnected())
  if (wsocket.isconnected() == false) {
    wsocket.connect()
    setTimeout(function() {
      printWaitingNumber(wNumber, pName, pNumber, type)
    }, 4000)
  }
  wsocket.postmessage(sMessage)
    
  /*
  printer.setFontAlign(1)
  printer.println(ascii.LF)
  printer.println('*******************************')

  printer.println(util.format('Waiting Number: %s', sNumber))
  
  printer.println('*******************************')
  printer.println(ascii.LF)
  printer.println(ascii.LF)
  printer.partialCut()
  */
}


function Sound(source,volume,loop)
{
    this.source=source;
    this.volume=volume;
    this.loop=loop;
    var son;
    this.son=son;
    this.finish=false;
    this.stop=function()
    {
        document.body.removeChild(this.son);
    }
    this.start=function()
    {
        if(this.finish)return false;
        this.son=document.createElement("embed");
        this.son.setAttribute("src",this.source);
        this.son.setAttribute("hidden","true");
        this.son.setAttribute("volume",this.volume);
        this.son.setAttribute("autostart","true");
        this.son.setAttribute("loop",this.loop);
        document.body.appendChild(this.son);
    }
    this.remove=function()
    {
        document.body.removeChild(this.son);
        this.finish=true;
    }
    this.init=function(volume,loop)
    {
        this.finish=false;
        this.volume=volume;
        this.loop=loop;
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getPatientInfo:(sNumber) => {
    
    // printWaitingNumber("1154", "홍길동", sNumber)
    // return false

    if (sNumber && (sNumber.length == 8 || sNumber.length == 13)) {
      
      let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_PAT_KIOSK_SELECT]]> </QID><QTYPE> <![CDATA[Package]]> </QTYPE><USERID> <![CDATA[RTE]]>  </USERID>  <EXECTYPE>  <![CDATA[FILL]]>  </EXECTYPE>   <P0>  <![CDATA[02]]>  </P0>  <P1>  <![CDATA[%s]]>  </P1>  <P2> <![CDATA[%s]]>  </P2>  <P3> <![CDATA[%s]]> </P3></Table>"
      let sParam = ""
      let sChecker = ""
      let ssn = ""
      let pn = ""

      if (sNumber.length == 8) {
        // 등록번호
        pn = sNumber
        sChecker = "1"
        // ssn = "1903061042114"
      }
      else if (sNumber.length == 13) {
        // 주민번호
        ssn = sNumber
        sChecker = "2"

      }

      sParam = util.format(sQuery, sChecker, pn, ssn)
      soap.createClient(test_url2, function(err, client) {
        const args = {
          sGubun: 'GETQUERY',
          sParam: sParam
        }
        
        // LMService Result >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        if (client && client.LMService) {
          client.LMService(args, function(err, result) {
            if(result.LMServiceResult) {
              const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
              console.log('getPatientInfo:xData', xData)
              if(xData.NewDataSet.Table) {
                const xxData = xData.NewDataSet.Table
                const patientInfoHtml_ = '이름:%s<br/>성별:%s<br/>생년월일:%s'
                const patientInfoHtml = util.format(patientInfoHtml_ ,xxData.PT_NM._text, xxData.SEX_TP_NM._text, xxData.PT_BRDY_DT._text)
                confirm_pno.value = xxData.PT_NO._text
                confirm_pname.value = xxData.PT_NM._text
                // 확인 버튼 클릭
                openConfirmWindow(patientInfoHtml, xxData.PT_NO._text)
              }
              else {
                openPopupWindow("등록된 정보가 없습니다.", "invalid_number")
              }
            }
          })
        } else {
          console.log('getPatientInfo', 'soap result error : no LMService')
          
        }

        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LMService Result
        
      })
    }
    else {
      // console.log('err','올바른 조회 번호를 입력하시오')
      openPopupWindow('올바른 조회번호를 입력하시요.')      
    }
  },
  getWaitingNumbers: () => {
    
      let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_KIOSK_TOTALWAIT_SELECT]]> </QID><QTYPE><![CDATA[Package]]></QTYPE><USERID><![CDATA[RTE]]></USERID><EXECTYPE><![CDATA[FILL]]></EXECTYPE><P0><![CDATA[02]]></P0></Table>"
      let sParam = sQuery
      soap.createClient(test_url2, function(err, client) {
        const args = {
          sGubun: 'GETQUERY',
          sParam: sParam
        }

        // LMService Result >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        if (client && client.LMService) {
                 
          client.LMService(args, function(err, result) {
            if(result.LMServiceResult) {
              const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
              console.log('xData', xData)
              if(xData.NewDataSet.Table) {
                const xxData = xData.NewDataSet.Table
                changeWaitingNumbers(xxData.CNT._text)
              }
            }
          })
        }
        else {
          console.log('getWaitingNumbers', 'soap result error : no LMService')
        }
        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LMService Result
        
      })
        
  },
  getReservation: (sNumber) => {

    getReservationInfo(sNumber)
  }
  
}


