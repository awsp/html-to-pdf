var fs = require('fs');
var path = require('path');
var express = require("express");
var multer  = require('multer');
var exec = require('child_process').exec;
var Agenda = require('agenda');
var agenda = new Agenda({db: {address: 'localhost:27017/agenda'}});
var app = express();
var uploadFinish = false;
var fileName, fileLocation;
var dest = './uploads/';
var config = {
  pdfLifeTime: '3 minutes'
};


app.use(multer({ dest: dest,
  rename: function (fieldname, filename) {
    fileName = filename + Date.now(); 
    return fileName;
  },
  onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...'); 
  },
  onFileUploadComplete: function (file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path); 
    fileLocation = file.path; 
    uploadFinish = true;
  }
}));

app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.post('/pdf', function(req, res) {
  if (uploadFinish) {    
    exec("wkhtmltopdf --footer-center '[page]/[topage]' --footer-font-size 10 " + fileLocation + " " + __dirname + '/public/' + fileName + ".pdf", function puts(error, stdout, stderr) {
      
      // Schedule to delete 2 tmp files
      agenda.define('remove tmp files', function (job, done) {
        fs.unlinkSync(__dirname + '/public/' + fileName + ".pdf");
        fs.unlinkSync(fileLocation);
        done();
      });

      agenda.schedule('in ' + config.pdfLifeTime, 'remove tmp files', {time: new Date()});
      agenda.start();

      res.redirect("http://" + req.headers.host + "/" + fileName + ".pdf");
    });
    
  }
});

/*Run the server.*/
app.listen(process.env.port || 3000, function() {
  console.log("App is listening on port 3000");
});