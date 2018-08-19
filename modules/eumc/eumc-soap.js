const {ipcRenderer} = require('electron')
const soap = require('soap')
const convert = require('xml-js')
const util = require('util')
const test_url1 = 'http://esysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url2 = 'http://devensysinf.eumc.ac.kr/MS/LM/LMWebService.asmx?wsdl'
const test_url3 = 'http://www.holidaywebservice.com//HolidayService_v2/HolidayService2.asmx?wsdl'


const checkBtn = document.getElementById('eumc-soap')
const inputSSN = document.getElementById('I_SSN')
const inputPN = document.getElementById('I_PN')

const btnTest = document.getElementById('btn-test-soap')
const txtTestResult = document.getElementById('txt-test-result')

checkBtn.addEventListener('click', (event) => {
  let ssn = inputSSN ? inputSSN.value : ''
  let pn = inputPN ? inputPN.value : ''
  let checkString = util.format("주민번호:%s, 환자번호:%s",ssn, pn)

  alert(checkString)

  soap.createClient(test_url2, function(err, client) {
    const args = {
      sGubun: 'GETQUERY',
      sParam: "<?xml version='1.0' encoding='UTF-8'?><Table><QID><![CDATA[PKG_MSE_LM_INTERFACE.PC_MSE_PAT_KIOSK_SELECT]]> </QID><QTYPE> <![CDATA[Package]]> </QTYPE><USERID> <![CDATA[RTE]]>  </USERID>  <EXECTYPE>  <![CDATA[FILL]]>  </EXECTYPE>   <P0>  <![CDATA[02]]>  </P0>  <P1>  <![CDATA[2]]>  </P1>  <P2> <![CDATA[11377964]]>  </P2>  <P3> <![CDATA[1903061042114]]> </P3></Table>"
    }
      
    client.LMService(args, function(err, result) {
        console.log(result)
    })
  })
  // ipcRenderer.send('print-to-pdf')
})

btnTest.addEventListener('click', (event) => {
  alert('test soap')

  soap.createClient(test_url3, function(err, client) {
    const args = {
      countryCode: 'Canada',
    }
      
    client.GetHolidaysAvailable(args, function(err, result) {
      
      console.log(result)
      console.log(result.GetHolidaysAvailableResult)
      txtTestResult.innerHTML = result.GetHolidaysAvailableResult
    })
  })
})

ipcRenderer.on('wrote-pdf', (event, path) => {
  //const message = `Wrote PDF to: ${path}`
  //document.getElementById('pdf-path').innerHTML = message
})
