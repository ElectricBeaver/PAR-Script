function doGet(e) {
  let page = e.parameter.mode || "Index";
  let html = HtmlService.createTemplateFromFile(page).evaluate();
  let htmlOutput = HtmlService.createHtmlOutput(html);
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');

  //Replace {{NAVBAR}} with the Navbar content
  htmlOutput.setContent(htmlOutput.getContent().replace("{{NAVBAR}}",getNavbar(page)));
  return htmlOutput;
}


//Create Navigation Bar
function getNavbar(activePage) {
  var scriptURLHome = getScriptURL();
  var scriptURLPage1 = getScriptURL("mode=Departments");
  var scriptURLPage2 = getScriptURL("mode=Civs");
  var scriptURLPage3 = getScriptURL("mode=Page3");

  var navbar = 
    `<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
        <a class="navbar-brand" href="${scriptURLHome}">Paleto Auto Repair</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div class="navbar-nav">
            <a class="nav-item nav-link ${activePage === 'Index' ? 'active' : ''}" href="${scriptURLHome}">Home</a>
            <a class="nav-item nav-link ${activePage === 'Departments' ? 'active' : ''}" href="${scriptURLPage1}">Departments</a>
            <a class="nav-item nav-link ${activePage === 'Civs' ? 'active' : ''}" href="${scriptURLPage2}">Civs</a>
          </div>
        </div>
        </div>
      </nav>`;
  return navbar;
}


//returns the URL of the Google Apps Script web app
function getScriptURL(qs = null) {
  var url = ScriptApp.getService().getUrl();
  if(qs){
    if (qs.indexOf("?") === -1) {
      qs = "?" + qs;
    }
    url = url + qs;
  }
  return url;
}

//INCLUDE HTML PARTS, EG. JAVASCRIPT, CSS, OTHER HTML FILES
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* DEFINE GLOBAL VARIABLES, CHANGE THESE VARIABLES TO MATCH WITH YOUR SHEET */
function globalVariables(){ 
  var varArray = {
    spreadsheetId   : '', //** CHANGE !!! 
    dataRage        : 'Departments!A2:G',                                //** CHANGE !!!
    idRange         : 'Departments!A2:A',                                //** CHANGE !!!
    lastCol         : 'G',                                            //** CHANGE !!!
    insertRange     : 'TestData!A1:G1',                               //** CHANGE !!!
    insertRangeDep  : 'Departments!A2:G',
    insertRangeCiv  : 'Civilians!A2:E',
    sheetID         : ''                                             //** CHANGE !!! Ref:https://developers.google.com/sheets/api/guides/concepts#sheet_id
  };
  return varArray;
}

/*
# PROCESSING FORM ---------------------------------------------------------------------------------
*/

function getActive(formObject){
  let x = formObject.formCheck
  Logger.log("FUNCTION: getActive() REF: %s", x);

  processForm(formObject);
  return x

}

/* PROCESS FORM */
function processForm(formObject){  
  Logger.log("form = %s", formObject.formCheck)
  if(formObject.formCheck === "depForm"){
    Logger.log("Form is depForm: Inside If statment")

    if(formObject.RecId && checkID(formObject.RecId)){//Execute if form passes an ID and if is an existing ID
    updateData(getFormValues(formObject),globalVariables().spreadsheetId,getRangeByID(formObject.RecId)); // Update Data
    }else{ //Execute if form does not pass an ID
    appendData(getFormValues(formObject),globalVariables().spreadsheetId,globalVariables().insertRangeDep); //Append Form Data
    }


  }else if(formObject.formCheck === "civForm"){
    Logger.log("Form is civForm: Inside If statment")
    if(formObject.RecId && checkID(formObject.RecId)){//Execute if form passes an ID and if is an existing ID
    updateData(getFormValues(formObject),globalVariables().spreadsheetId,getRangeByID(formObject.RecId)); // Update Data
    }else{ //Execute if form does not pass an ID
    appendData(getFormValues(formObject),globalVariables().spreadsheetId,globalVariables().insertRangeCiv); //Append Form Data
    }
  }else{
    Logger.log("It brokey")
  }
  return getLastTenRows(formObject.formCheck);//Return last 10 rows
}


/* GET FORM VALUES AS AN ARRAY */

function getFormValues(formObject){
/* ADD OR REMOVE VARIABLES ACCORDING TO YOUR FORM*/
  /* Department Form */ 
  if(formObject.formCheck === "depForm"){
    Logger.log("FUNCTION: getFormValues() REF: depForm");
    if(formObject.RecId && checkID(formObject.RecId)){
      var values = [[formObject.RecId.toString(),
                    formObject.service,
                    formObject.operator,
                    formObject.date,
                    formObject.price,
                    formObject.department,
                    formObject.officer,
                    formObject.plate,
                    formObject.notes]];
    }else{
      var values = [[new Date().getTime().toString(),//https://webapps.stackexchange.com/a/51012/244121
                    formObject.service,
                    formObject.operator,
                    formObject.date,
                    formObject.price,
                    formObject.department,
                    formObject.officer,
                    formObject.plate,
                    formObject.notes]];
    }
  }else if (formObject.formCheck === "civForm"){ /* Civ Form */ 
    Logger.log("FUNCTION: getFormValues() REF: civForm");
    if(formObject.RecId && checkID(formObject.RecId)){
      var values = [[formObject.RecId.toString(),
                    formObject.service,
                    formObject.operator,
                    formObject.date,
                    formObject.price,
                    formObject.plate,
                    formObject.notes]];
    }else{
      var values = [[new Date().getTime().toString(),//https://webapps.stackexchange.com/a/51012/244121
                    formObject.service,
                    formObject.operator,
                    formObject.date,
                    formObject.price,
                    formObject.plate,
                    formObject.notes]];
    }
  }else{
    Logger.log("FUNCTION: getFormValues() REF: It Brokey")
  }
  return values;
}


/*
## CURD FUNCTIONS ----------------------------------------------------------------------------------------
*/


/* CREATE/ APPEND DATA */
function appendData(values, spreadsheetId,range){
  var valueRange = Sheets.newRowData();
  valueRange.values = values;
  var appendRequest = Sheets.newAppendCellsRequest();
  appendRequest.sheetID = spreadsheetId;
  appendRequest.rows = valueRange;
  var results = Sheets.Spreadsheets.Values.append(valueRange, spreadsheetId, range,{valueInputOption: "RAW"});
}


/* READ DATA */
function readData(spreadsheetId,range){
  var result = Sheets.Spreadsheets.Values.get(spreadsheetId, range);
  return result.values;
}


/* UPDATE DATA */
function updateData(values,spreadsheetId,range){
  var valueRange = Sheets.newValueRange();
  valueRange.values = values;
  var result = Sheets.Spreadsheets.Values.update(valueRange, spreadsheetId, range, {
  valueInputOption: "RAW"});
}


/*DELETE DATA*/
function deleteData(ID){ 
  //https://developers.google.com/sheets/api/guides/batchupdate
  //https://developers.google.com/sheets/api/samples/rowcolumn#delete_rows_or_columns
  var startIndex = getRowIndexByID(ID);
  
  var deleteRange = {
                      "sheetId"     : globalVariables().sheetID,
                      "dimension"   : "ROWS",
                      "startIndex"  : startIndex,
                      "endIndex"    : startIndex+1
                    }
  
  var deleteRequest= [{"deleteDimension":{"range":deleteRange}}];
  Sheets.Spreadsheets.batchUpdate({"requests": deleteRequest}, globalVariables().spreadsheetId);
  
  return getLastTenRows();//Return last 10 rows
}



/* 
## HELPER FUNCTIONS FOR CRUD OPERATIONS --------------------------------------------------------------
*/ 


/* CHECK FOR EXISTING ID, RETURN BOOLEAN */
function checkID(ID){
  var idList = readData(globalVariables().spreadsheetId,globalVariables().idRange,).reduce(function(a,b){return a.concat(b);});
  return idList.includes(ID);
}


/* GET DATA RANGE A1 NOTATION FOR GIVEN ID */
function getRangeByID(id){
  if(id){
    var idList = readData(globalVariables().spreadsheetId,globalVariables().idRange);
    for(var i=0;i<idList.length;i++){
      if(id==idList[i][0]){
        return 'TestData!A'+(i+2)+':'+globalVariables().lastCol+(i+2);
      }
    }
  }
}


/* GET RECORD BY ID */
function getRecordById(id){
  if(id && checkID(id)){
    var result = readData(globalVariables().spreadsheetId,getRangeByID(id));
    return result;
  }
}


/* GET ROW NUMBER FOR GIVEN ID */
function getRowIndexByID(id){
  if(id){
    var idList = readData(globalVariables().spreadsheetId,globalVariables().idRange);
    for(var i=0;i<idList.length;i++){
      if(id==idList[i][0]){
        var rowIndex = parseInt(i+1);
        return rowIndex;
      }
    }
  }
}


/*GET LAST 10 RECORDS */
function getLastTenRows(formOb){
  if(formOb === "depForm"){
    Logger.log("FUNCTION: getLastTenRows() REF: depForm");
  }else if(formOb === "civForm"){
    Logger.log("FUNCTION: getLastTenRows() REF: civForm");
  }

  var lastRow = readData(globalVariables().spreadsheetId,globalVariables().dataRage).length+1;
  if(lastRow<=11){
    var range = globalVariables().dataRage;
  }else{
    var range = 'TestData!A'+(lastRow-9)+':'+globalVariables().lastCol;
  }
  var lastTenRows = readData(globalVariables().spreadsheetId,range);
  return lastTenRows;
}


/* GET ALL RECORDS */
function getAllData(){
  var data = readData(globalVariables().spreadsheetId,globalVariables().dataRage);
  return data;
}


/*
## OTHER HELPERS FUNCTIONS ------------------------------------------------------------------------
*/


/*GET DROPDOWN LIST */
function getDropdownList(range){
  var list = readData(globalVariables().spreadsheetId,range);
  return list;
}


/* INCLUDE HTML PARTS, EG. JAVASCRIPT, CSS, OTHER HTML FILES */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}
