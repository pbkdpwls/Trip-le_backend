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
        const collectiong = myDb.collection('myTable3');

        // 이메일 인증
        app.post('/check', (req, res)=> {
            const sendEmail  = req.body.email;

            const smtpTransport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: sendEmail,
                    pass: "password"
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

        // group id 생성
        app.get('/groupid', (req, res) => {
            function randomString() {
                var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
                var string_length = 10;
                var randomstring = '';
                for (var i=0; i<string_length; i++) {
                    var rnum = Math.floor(Math.random() * chars.length);
                    randomstring += chars.substring(rnum,rnum+1);
                }
                console.log(randomstring)
                console.log(typeof(randomstring))
                res.status(200).send(randomstring);
    
                /*
                // group id 중복 확인
                collectiong.findOne(group_id, (err, result) => {
                    if(result != null){
                        randomString();
                    }
                    else{
                        debug("중복확인"+randomString)
                        res.status(200).send(randomstring);
                    }
                });
                */
            }

            randomString();
        })

        // Add Group page
        app.post('/add_group', (req, res) => {
            const newGroup = {
                group_id: req.body.groupid,
                group_email: req.body.email,
                group_name: req.body.groupname,
                group_date: req.body.groupdate,
                group_place: req.body.groupplace,
                group_schoolinfo: req.body.scohoolinfo,
            };

            const q_email = {email: newGroup.email};
            collection.findOne(q_email, (err, result) => {
                if(result =! null) {
                    collectiong.insertOne(newGroup, (err, result) => {
                        res.status(200).send("새로운 그룹 추가 성공");
                        console.log("그룹 추가 성공")
                    });
                } else {
                    res.status(400).send("새로운 그룹 추가 실패");
                    console.log("그룹 추가 실패")
                }
            });
        });

        // 그룹 삭제하기
        app.post('/delete_group', (req, res) => { 
            const q_group = {
                group_email: req.body.groupemail,
                group_name: req.body.groupname
            }
            collectiong.findOne(q_group, (err, result) => {
                if(result != null) {
                    collectiong.updateOne({}, {$unset: {group_email: req.body.groupemail}})
                    res.status(200).send("그룹 삭제 완료");
                } 
                else {
                    res.status(404).send("그룹 삭제에 오류가 발생했습니다.");
                }
            });

            // **그룹 전체 삭제 추가하기
        });
        
        // 그룹 검색하기
        app.post('/search_group', (req, res) => {
            const q_searchid = {search_id: req.body.searchid}
            collectiong.findOne(q_searchid, (err, result) => {
                if(result != null){
                    res.send(group_id, group_name);
                }else{
                    res.status(400).send("존재하지 않는 그룹 id입니다.");
                }
            });
        });

        // 검색한 그룹 추가하기
        app.post('/add_search_group', (req, res) => {
            const q_groupid = {group_id: req.body.group_id}
            collectiong.findOne(q_groupid, (err, q_searchid) => {
                // **@가 있는 내용 개수 카운트 후 숫자 추가하기
                const q_email = {group_email: req.body.email};
                // id에 newgroup 추가
                collection.findOne(q_groupid, (err, result) => {
                    if(result =! null) {
                        collectiong.insertOne(q_email, (err, result) => {
                            res.status(200).send("그룹에 유저 추가 성공");
                        });
                    } else {
                        res.status(400).send("그룹에 유저 추가 실패");
                    }
                });
                
            });
        });

        //collection.find({email: newUser.email}, )
        // 그룹 정보 가져오기
        app.get('/group', (req, res) => {
            const q_group = {
                email: req.body.email,
                group_name: req.body.groupname
            }
            collectiong.findOne(q_group, (err, result) => {
                if(result =! null) {
                    res.send(group_id, group_date, group_place, group_schoolname, group_classname);
                } else {
                    res.status(400).send("그룹 정보 가져오기 실패");
                }
            });
        })

        // 홈 화면 조회하기
        app.post('/home', (req, res) => {
            var arr_name = []
            collectiong.find({group_email: req.body.email},{projection:{_id:-1, group_name:1} }).toArray(function(err, result) 
            { 
                for(var i=0; i<result.length; i++){
                    arr_name[i] = result[i].group_name
                }
                //console.log(arr_name)
                res.status(200).send(arr_name)
            });

            
        })
    }
});

app.listen(3000, () => {
    console.log("listening on port 3000....");
});
