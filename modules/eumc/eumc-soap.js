const {ipcRenderer} = require('electron')
const soap = require('soap')
const convert = require('xml-js')
const util = require('util')
const test_url1 = 'http://esysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url2 = 'http://devensysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url3 = 'http://www.holidaywebservice.com//HolidayService_v2/HolidayService2.asmx?wsdl'

const xConvert = require('xml-js');

module.exports = {
  getPatientInfo:(sNumber) => {
    
    // let checkString = util.format("주민번호:%s, 환자번호:%s",ssn, pn)
    // pn : 11377964, ssn: 1903061042114
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

      console.log('sParam', sParam)
      
      soap.createClient(test_url2, function(err, client) {
        const args = {
          sGubun: 'GETQUERY',
          sParam: sParam
        }
        
        // console.log('client', client)
        
        client.LMService(args, function(err, result) {
          if(result.LMServiceResult) {
            const xData = xConvert.xml2js(result.LMServiceResult, {compact: true})
            console.log('result.LMServiceResult', result.LMServiceResult)
            console.log('xdata', xData)
            if(xData.NewDataSet.Table) {
              const xxData = xData.NewDataSet.Table
              console.log('dae', xxData.PT_BRDY_DT._text)

            }
          }
        })
        
      })
    }
    else {
      console.log('err','올바른 조회 번호를 입력하시오')      
    }
  }
}


