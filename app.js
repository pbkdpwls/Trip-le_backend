const express = require('express');
const app = express();
const mongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');
const path = require("path"); 

const url = "mongodb://localhost:27017";

// multer
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'uploads/')
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname)
  }
});

const upload = multer({storage: storage});

app.use(express.json());

/* min ~ max까지 랜덤으로 숫자를 생성하는 함수 */ 
var generateRandom = function (min, max) {
    var ranNum = Math.floor(Math.random()*(max-min+1)) + min;
    return ranNum;
}

mongoClient.connect(url, (err, db) => {
    if (err) {
        console.log('Error while connecting mongo client');
    } 
    else {
        const myDb = db.db('myDb');
        const collection = myDb.collection('myTable2');

        // 이메일 인증
        app.post('/check', (req, res)=> {
            const sendEmail  = req.body.email;

            const smtpTransport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: sendEmail,
                    pass: "142612pyj!"
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            
            const Checking = generateRandom(111111,999999)
                    
            console.log(req.body.email);
            
            const mailOptions = {
                from: "Triple, 여행을 편안하게",
                to: sendEmail,
                subject: "[Triple] 인증 관련 이메일 입니다",
                text: "오른쪽 숫자 6자리를 입력해주세요 : " + Checking
            };
            
            const mailToCheking = {
                email : req.body.email,
                Checking : Checking
            }

            console.log(Checking);

            smtpTransport.sendMail(mailOptions, (error) => {
                if (error) {
                    console.log("에러입니다.");
                    console.log(error);
                } 
                else {
                    /* 클라이언트에게 인증 번호를 보내서 사용자가 맞게 입력하는지 확인! */
                    console.log("정상 실행");
                    res.status(200).send(mailToCheking);
                }
                smtpTransport.close();
            });
            
            
        });

        //회원가입
        app.post('/signup', (req, res) => {
            
            const newUser = {
                email : req.body.email,
                name : req.body.name,
                password : req.body.password,
                job : req.body.job
            };
            
            const query = {email: newUser.email};

            collection.findOne(query, (err, result) => {
                if(result == null) {
                    collection.insertOne(newUser, (err, result) => {
                        res.status(200).send();
                    });
                } else {
                    res.status(400).send();
                }
            });
            
        });

        //로그인
        app.post('/login', (req, res) =>{
            
            console.log(req.body);
            
            const query = {
                email: req.body.email,
                password: req.body.password
            }

            collection.findOne(query, (err, result) => {
                if(result!=null){
                    const objToSend = {
                        email : req.body.email,
                        name : req.body.name,
                        password : req.body.password,
                        job : req.body.job
                    }
    
                    res.status(200).send(JSON.stringify(objToSend));
                } else {
                    //result.status(404).send();
                    console.log("오류");
                }
            });
        })

        // 사용자 사진 목록 등록
        app.post('/groupimage', upload.array('photo'), (req, res)=>{
            console.log("파일업로드했습니다");
            console.log(req.files);
            res.end();
        });

        // 탈퇴하기
        app.post('/leave', (req, res) => { 
            const query = {
                email: req.body.email,
                password: req.body.password
            }
            
            collection.findOne(query, (err, result) => {
                if(result != null) {
                    collection.deleteOne(result, (err, obj) => {
                        res.status(200).send();
                        console.log("탈퇴 완료.");
                    });
                } 
                else {
                    res.status(404).send();
                    console.log("탈퇴하려는 회원의 정보가 없습니다.");
                }
            });

        })

    }
});

app.listen(3000, () => {
    console.log("listening on port 3000....");
});
