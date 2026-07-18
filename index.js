import { log } from 'node:console'; 
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'path';
import { WebSocketServer } from 'ws';
import mongoose  from 'mongoose'
import { type } from 'node:os';


const PORT = process.env.PORT ?? 9000;
//connecting DB
mongoose.connect('mongodb+srv://rajkumarpersonal7_db_user:JJGRgYlOYFSLfPiW@cluster0.trddeud.mongodb.net/?appName=Cluster0')
    .then(()=>console.log('connected to MongoDB!'))
    .catch((err)=>console.log('mongoDB connection error:',err));
    //schema
    const messageSchema =new mongoose.Schema({
        username: String,
        message: String,
        timestamp:{type: Date, default:Date.now}
    }
    );

    const Message=mongoose.model('Message', messageSchema);

const httpServer = http.createServer(async function (req,res) {
    const indexFile = await fs.readFile(path.resolve('./index.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    return res.end(indexFile);
});
const wsServer =new WebSocketServer({server : httpServer});

wsServer.on('connection' , async (websocket)=>{
    console.log(`WebSocket Connection....`);
    try{
        const chatHistory =  await Message.find().sort({ timestamp: 1 }).limit(50).lean();
        websocket.send(JSON.stringify({
            type:'history',
            data:chatHistory

        }))
    }catch(err){
        console.error("error fetching History", err);
    }
    websocket.on('message',async(data)=>{
        const parsedData=JSON.parse(data.toString());
        if(parsedData.type==='chat'){
            try{
                const newDbMessage=new Message({
                    username: parsedData.username || 'Anonymous',
                    message:parsedData.message
                });
                await newDbMessage.save();
            }catch(err){
                console.error("error saving message", err);
            }
        }
        console.log(`websokcet message Recv...` ,data.toString());
        wsServer.clients.forEach((client)=>{
            if (client.readyState===1){
                client.send(data.toString());
    }});
        
    });
});

httpServer.listen(PORT, () =>{
    console.log(`server is running on on http://localhost:${PORT}`);
    
})
