// version:18.09.13
const {ipcRenderer, remote} = require('electron')
const soap = require('soap')
const convert = require('xml-js')
const util = require('util')
const fs = require('fs')
const dateFormat = require("dateformat")

const sBasePath = remote.app.getAppPath().toString()
const sConfigPath = sBasePath + '/config.json' 
let sRunAs = ""
let jConfig = null
if (fs.existsSync(sConfigPath) === true)
{
  jConfig = JSON.parse(fs.readFileSync(sConfigPath)) 

  sRunAs = jConfig["runas"] ? jConfig["runas"] : "dev" 
  console.log('sRunAs', sRunAs)
}
else
{
  console.log('no config file')
}

const prod_url = 'http://esysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const dev_url = 'http://devensysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url = 'http://www.holidaywebservice.com//HolidayService_v2/HolidayService2.asmx?wsdl'
const service_url = (sRunAs == 'prod') ? prod_url : dev_url

console.log('service_url', service_url)

const xConvert = require('xml-js')
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
const div_service_status = document.getElementById('div_service_status')

const sound_do_apply = new Sound("assets/audio/번호가 호출되면 접수하세요.mp3",100,false);
const sound_go_reception = new Sound("assets/audio/수납 후 접수대로 오세요.mp3",100,false);
const sound_wating_blood = new Sound("assets/audio/채혈실 안에서 대기하세요. 번호가 호출되면 채혈하세요.mp3",100,false);

let prevent_input = false

div_service_status.innerText = (sRunAs == 'dev') ? "Running as TEST mode" : ""

btn_confirm_canncel.addEventListener('click', function(event) {
  closeConfirmWindow()
})

btn_confirm_ok.addEventListener('click', function(event){
  const ptnum = confirm_title.innerText
  if(!isNaN(ptnum)) {
    getReservationInfo(ptnum)
  }

  // TEST for PRINT RECEIPT / BLOOD
  // printWaitingNumber('0012', '이정환', '12345678', 'RECEIPT', '내분비내과')
  
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
    if (type != 'preserv') {
      txt_search_number.value = ""
    }
  
  }, 4000)
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

function printWaitingNumber(wNumber, pName, pNumber, type, dept_nm) {
  let oMessage = {}
  let sound_play = null
  
  oMessage.device = "thermalPrinter"
  oMessage.command = "print_waitingNumber"

  oMessage.waitingNumber = wNumber
  oMessage.patientName = pName
  oMessage.patientNumber = pNumber

  switch(type) {
    case 'BLOOD':
      oMessage.title = "채혈하실 분"
      oMessage.contents1 = dept_nm + " 검사가 진행됩니다."
      oMessage.contents2 = "채혈실 안에서 대기하세요.\n채혈후 5분이상 눌러주세요."
    
      sound_play = sound_wating_blood
      break;
    case 'RECEIPT':
      oMessage.title = "접수하실 분"
      oMessage.contents1 = dept_nm + " 검사비 수납이 필요합니다."
      oMessage.contents2 = "수납 후 접수대로 오세요."
      
      sound_play = sound_go_reception
      break;
    default:
      oMessage.title = "접수 대기"
      oMessage.contents1 = "번호가 호출되면 접수하세요."
      oMessage.contents2 = ""
      sound_play = sound_do_apply
  } 
  oMessage.footer = "이화여자대학교 목동병원 진단검사의학과";

  openPopupWindow(oMessage.contents1 + "<br/>" + oMessage.contents2)
  closeConfirmWindow()

  const sMessage = JSON.stringify(oMessage)
  console.log('wsocket.isconnected', wsocket.isconnected())
  if (wsocket.isconnected() == false) {
    wsocket.connect()
    setTimeout(function() {
      printWaitingNumber(wNumber, pName, pNumber, type, dept_nm)
    }, 4000)
  }
  else {
    wsocket.postmessage(sMessage)
    sound_play.start()
  }
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

    soap.createClient(service_url, function(err, client) {
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
            let cData = null

            console.log('itemCount',itemCount)
            
            if (itemCount > 1) {

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
              openPopupWindow("예정된 진료가 없습니다.")
            } 
            else if (itemCount == 1 && bAcceptFull == true) {
              setAutoBloodCollection(cData.PT_NO._text, cData.EXM_HOPE_DT._text, cData.PT_NM._text, cData.DEPT_NM._text)
              console.log('setAutoBloodCollection', cData)
            }
            else {
                
              if (itemCount > 1 && bAcceptFull == false) {
                for(let i = 0;i<xxData.length; i++) {
                  const cData = xxData[i]
    
                  if (cData.RPY_STS_CD._text == 'N') {
                    setWaitingNumber(sNumber, cData.PT_NM._text,'RECEIPT', cData.DEPT_NM._text)
                    break
                  }
                }

              }  
              else {
                if (bAcceptFull == false)
                {
                  setWaitingNumber(sNumber, cData.PT_NM._text,'RECEIPT', cData.DEPT_NM._text)
                } 
                else
                {
                  setWaitingNumber(sNumber, cData.PT_NM._text,'WAIT_CALL', '')
                }
                
              }
              
            }
          }
          else 
          {
            setWaitingNumber(sNumber, confirm_pname.value, '', '')
          }
        }
      })
      
    })
  }
  else {
    openPopupWindow("올바른 조회 번호를 입력하세요.")      
  }

}

function setWaitingNumber(sNumber, pName, type, dept_nm) {
    
  if (sNumber && (sNumber.length == 8)) {
    let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_INS_KIOSK_WAITNO]]> </QID><QTYPE> <![CDATA[Package]]> </QTYPE><USERID> <![CDATA[RTE]]>  </USERID>  <EXECTYPE>  <![CDATA[FILL]]>  </EXECTYPE>   <P0>  <![CDATA[02]]>  </P0>  <P1>  <![CDATA[%s]]>  </P1></Table>"
    let sParam = ""
    let pn = sNumber
    sParam = util.format(sQuery, pn)

    console.log('sParam', sParam)
    
    soap.createClient(service_url, function(err, client) {
      const args = {
        sGubun: 'SETQUERY',
        sParam: sParam
      }
     
      client.LMService(args, function(err, result) {
        
        if(result.LMServiceResult) {
          const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
          console.log('xData', xData)
          if(xData.NewDataSet.Table) {
            const xxData = xData.NewDataSet.Table
            // console.log('xxData', xxData)
            const checkNum = xxData.Return.Value._text
            // console.log('setWaitingNumber',xxData.Return.Value._text)
            if (checkNum == "0000") {
              printWaitingNumber(xxData.Return.Value._text, pName, sNumber, type, dept_nm)
            }
            else {             
              printWaitingNumber(xxData.Return.Value._text, pName, sNumber, type, dept_nm)
            }
          }
        }
        else {
          console.log('check', result)
        }
      })
      
    })
  }
  else {
    openPopupWindow('올바른 조회 번호를 입력하세요.')      
  }
}

function setAutoBloodCollection(sNumber, sHopeDate, sPtName, dept_nm) {
    
  if (sNumber && (sNumber.length == 8) && sHopeDate) {
    let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_INS_KIOSK_ACCEPT]]></QID><QTYPE><![CDATA[Package]]></QTYPE><USERID><![CDATA[RTE]]></USERID><EXECTYPE><![CDATA[FILL]]></EXECTYPE><P0><![CDATA[02]]></P0><P1><![CDATA[%s]]></P1><P2><![CDATA[%s]]></P2></Table>"
    let sParam = ""
    let pn = sNumber

    sParam = util.format(sQuery, pn, sHopeDate)

    soap.createClient(service_url, function(err, client) {
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
              printWaitingNumber(checkBloodNum, sPtName, sNumber, 'BLOOD', dept_nm)
            }
          }
        }
      })
      // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LMService Result
    })
  }
  else {
    console.log('err','올바른 조회 번호를 입력하세요.')      
  }
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
    // 환자번호(1) / 주민번호(2) 로 환자 정보 조회 결과

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
        // pn = sNumber
        ssn = sNumber
        sChecker = "2"
     }

      sParam = util.format(sQuery, sChecker, pn, ssn)
      console.log('getPatientInfo', sParam)

      soap.createClient(service_url, function(err, client) {
        const args = {
          sGubun: 'GETQUERY',
          sParam: sParam
        }
        
        // LMService Result >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        if (client && client.LMService) {
          client.LMService(args, function(err, result) {
            if (result.LMServiceResult) {
              const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
              if (typeof xData.NewDataSet.Table !== 'undefined') {
              
                const xxData = xData.NewDataSet.Table
                let itemCount = Array.isArray(xxData) ? xxData.length : 1
                
                // 환자번호 갯수 검사
                if (itemCount == 1) {
                  const patientInfoHtml_ = '이름:%s<br/>성별:%s<br/>생년월일:%s'
                  const patientInfoHtml = util.format(patientInfoHtml_ ,xxData.PT_NM._text, xxData.SEX_TP_NM._text, xxData.PT_BRDY_DT._text)
                  confirm_pno.value = xxData.PT_NO._text
                  confirm_pname.value = xxData.PT_NM._text
                  // 확인 버튼 클릭
                  openConfirmWindow(patientInfoHtml, xxData.PT_NO._text)
                }
                else {
                  openPopupWindow("접수대에 문의하세요.등록번호가 여러개입니다.", "pno_multiple")
                }
              }
              else {
                openPopupWindow("등록된 정보가 없습니다.", "invalid_number")
              }
            }
          })
        } else {
          // console.log('getPatientInfo', 'soap result error : no LMService')
          openPopupWindow('서버 데이터를 받아올 수 없습니다.<br/> 다시 시도 하십시요.', 'preserv')
        }

        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LMService Result
        
      })
    }
    else {
      openPopupWindow('올바른 조회번호를 입력하시요.')      
    }
  },
  getWaitingNumbers: () => {
    
      let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_KIOSK_TOTALWAIT_SELECT]]> </QID><QTYPE><![CDATA[Package]]></QTYPE><USERID><![CDATA[RTE]]></USERID><EXECTYPE><![CDATA[FILL]]></EXECTYPE><P0><![CDATA[02]]></P0></Table>"
      let sParam = sQuery
      soap.createClient(service_url, function(err, client) {
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
              if(typeof xData.NewDataSet.Table !== 'undefined') {
                const xxData = xData.NewDataSet.Table
                changeWaitingNumbers(xxData.CNT._text)
              }
            }
          })
        }
        else {
          // console.log('getWaitingNumbers', 'soap result error : no LMService')
          openPopupWindow('서버 데이터를 받아올 수 없습니다.<br/> 다시 시도 하십시요.', 'preserv')
        }
        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LMService Result
        
      })
        
  },
  getReservation: (sNumber) => {
    getReservationInfo(sNumber)
  },
  getIsHoliday: () => {
    let sQuery = "<?xml version='1.0' encoding='UTF-8'?>"
    + "<Table>"
    + "<QID>"
    + "<![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_KIOSK_HDY_SELECT]]>"
    + "</QID>"
    + "<QTYPE>"
    + "<![CDATA[Package]]>"
    + "</QTYPE>"
    + "<USERID>"
    + "<![CDATA[RTE]]>"
    + "</USERID>"
    + "<EXECTYPE>"
    + "<![CDATA[FILL]]>"
    + "</EXECTYPE>"
    + "<P0>"
    + "<![CDATA[02]]>"
    + "</P0>"
    + "<P1>"
    + "<![CDATA[%s]]>"
    + "</P1>"
    + "</Table>";

    let sParam = ""
    let today = dateFormat(new Date(), "isoDate")
    sParam = util.format(sQuery, today)

    const args = {
      sGubun: 'GETQUERY',
      sParam: sParam
    }
    
    /*
    soap.createClientAsync(service_url).then((client) => {
      return client.LMServiceAsync(args)
    }).then((result) => {
      if(typeof result.LMServiceResult !== 'undefined') {
        const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
        console.log('xData', xData)
        if(typeof xData.NewDataSet.Table !== 'undefined') {
          const xxData = xData.NewDataSet.Table
          console.log('HDY_YN', HDY_YN)
        }
      }
    }).catch((err) => {
      console.log('error:', err)
    });
    */
    return new Promise((resolve, reject) => {
      soap.createClientAsync(service_url).then((client) => {
        return client.LMServiceAsync(args)
      }).then((result) => {
        if(typeof result.LMServiceResult !== 'undefined') {
          const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
          console.log('xData', xData)
          if(typeof xData.NewDataSet.Table !== 'undefined') {
            const xxData = xData.NewDataSet.Table
            resolve(HDY_YN)
          }
        }
      }).catch((err) => {
        console.log('error:', err)
      });
  
      reject(new Error("Request is failed"));
      
    });
    
  }
 
}


