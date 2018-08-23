const {ipcRenderer} = require('electron')
const soap = require('soap')
const convert = require('xml-js')
const util = require('util')
const test_url1 = 'http://esysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url2 = 'http://devensysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url3 = 'http://www.holidaywebservice.com//HolidayService_v2/HolidayService2.asmx?wsdl'

const xConvert = require('xml-js');
const printer = require('../thermal-printer/printer')

const txtWaitingNumbers = document.getElementById('txtWaitingNumbers')
const popup = document.getElementById('popup') 
const popup_content = document.getElementById('popup_content')

function changeWaitingNumbers(sNumber) {
  console.log('change', sNumber)
  txtWaitingNumbers.innerText = sNumber
}

function getReservationInfo(sNumber) {
  
  if (sNumber && (sNumber.length == 8)) {
    let popup_message = ""
    let sQuery = "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_BLCL_KIOSK_SELECT]]> </QID><QTYPE> <![CDATA[Package]]> </QTYPE><USERID> <![CDATA[RTE]]>  </USERID>  <EXECTYPE>  <![CDATA[FILL]]>  </EXECTYPE>   <P0>  <![CDATA[02]]>  </P0>  <P1>  <![CDATA[%s]]>  </P1></Table>"
    let sParam = ""
    let pn = sNumber
    sParam = util.format(sQuery, pn)

    soap.createClient(test_url2, function(err, client) {
      const args = {
        sGubun: 'GETQUERY',
        sParam: sParam
      }
      
      client.LMService(args, function(err, result) {
        if(result.LMServiceResult) {
          const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
          console.log(xData)
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
              setAutoBloodCollection(cData.PT_NO._text, cData.EXM_HOPE_DT._text)
              popup_message = "채혈실 안에서 대기하세요.<br/> 번호가 호출되면 채혈하세요."
            }
            else {
              if (bAcceptFull == false) {
                popup_message = "수납 후 접수대로 오세요."
                for(let i = 0;i<xxData.length; i++) {
                  const cData = xxData[i]
    
                  if (cData.RPY_STS_CD._text == 'N') {
                    let popup_message_ = "환자명:%s<br/>진료과명:%s<br/>진료희망일자:%s<br/>수납 후 접수대로 오세요." 
                    popup_message = util.format(popup_message_, cData.PT_NM._text, cData.DEPT_NM._text, cData.EXM_HOPE_DT._text)
                    break
                  }
                }
              }  
              else {
                popup_message = "대기하세요 번호가 호출됩니다."
              }
              setWaitingNumber(sNumber)
            }

            if (popup_message != "") {
              popup_content.innerHTML = popup_message
              popup.style.direction = 'block'
            }

          }
        }
      })
      
    })
  }
  else {
    console.log('err','올바른 조회 번호를 입력하시오')      
  }

}

function setWaitingNumber(sNumber) {
    
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
            console.log('setWaitingNumber',xxData.Return.Value._text)
            printer.setFontAlign(1)
            printer.println('\n')
            printer.println('*******************************')

            printer.println(util.format('Waiting Number: %s', xxData.Return.Value._text))

            printer.println('*******************************')
            printer.println('\n')
            printer.PartialCut()
       
          }
        }
      })
      
    })
  }
  else {
    console.log('err','올바른 조회 번호를 입력하시오')      
  }
}

function setAutoBloodCollection(sNumber, sHopeDate) {
    
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
 
      client.LMService(args, function(err, result) {
        if(result.LMServiceResult) {
          const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
          if(xData.NewDataSet.Table) {
            const xxData = xData.NewDataSet.Table
            console.log('setAutoBloodCollection',xxData.Return.Value._text)

          }
        }
      })
      
    })
  }
  else {
    console.log('err','올바른 조회 번호를 입력하시오')      
  }

}



module.exports = {
  getPatientInfo:(sNumber) => {
    
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
        
        client.LMService(args, function(err, result) {
          if(result.LMServiceResult) {
            const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
            if(xData.NewDataSet.Table) {
              const xxData = xData.NewDataSet.Table
              const patientInfoHtml_ = '이름:%s<br/>성별:%s<br/>생년월일:%s<br/><button type="button" class="dial btn-ok">확인</button>'
              const patientInfoHtml = util.format(patientInfoHtml_ ,xxData.PT_NM._text, xxData.SEX_TP_NM._text, xxData.PT_BRDY_DT._text)
              popup_content.innerHTML = patientInfoHtml
              popup.style.display = 'block'

              // 확인 버튼 클릭
              getReservationInfo(xxData.PT_NO._text)

            }
          }
        })
        
      })
    }
    else {
      console.log('err','올바른 조회 번호를 입력하시오')      
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
      
        client.LMService(args, function(err, result) {
          if(result.LMServiceResult) {
            const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
            console.log('xData', xData)
            if(xData.NewDataSet.Table) {
              const xxData = xData.NewDataSet.Table
              // console.log('xxData', xxData)
              console.log('getWaitingNumbers',xxData.CNT._text)
              changeWaitingNumbers(xxData.CNT._text)
            }
          }
        })
        
      })
        
  }
  
}


