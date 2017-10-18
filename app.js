var express =  require('express');
var mongodb = require('mongodb').MongoClient;
var path = require('path');
var shortid = require('shortid');
var validUrl = require('valid-url');
var app = express();
var port = process.env.PORT || 3000;
var dbUrl = process.env.DB_URL;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine','pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',function(req,res){
    res.render('index');
});

app.get('/short/',function(req,res){
    mongodb.connect(dbUrl,function(err,db){
        if(err) console.log('Unable to connect with MongoDB server.');
        var urls = db.collection('urls');
        var url = req.query.url;
        var urlCode = shortid.generate();
        var results;
        var regex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
        //Validating the URL
        if(regex.test(url) && validUrl.isWebUri(url)){
            //If Url is validated, Insert data into DB
            urls.insert({url:url,urlcode:urlCode});
            results = {
                original_url:url,
                shortened_url:"/"+urlCode
            }
        }
        else{
            results = {
                error:"Wrong url format, make sure you have a valid protocol and real site."
            }
        }
        res.send(results);
        db.close();
    });
});

app.get('/:urlCode',function(req,res){
    mongodb.connect(dbUrl,function(err,db){
        if(err) console.log('Unable to connect with MongoDB server.');
        var urls = db.collection('urls');
        urls.find({urlcode:req.params.urlCode},{url:1,_id:0}).toArray(function(err,redirectUrl){
            if(redirectUrl.length==0){
                res.send({error:"This url doesn't exist on our database."});
            }
            else{
                res.redirect(redirectUrl[0].url);
            }
        });
     
        db.close();
    });
});

app.listen(port);
