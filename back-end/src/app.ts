import express, {Application} from "express";
import cors from "cors";
import mongoose from 'mongoose';
import cookieParser from "cookie-parser";
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/usersRoutes.js'; 
import messagesRoutes from './routes/messagesRoutes.js'; 
import channelsRoutes from './routes/channelsRoutes.js'; 
import { Socket } from "socket.io";
import { Server } from "socket.io";
import http from "http";
import Message from "./models/messageModel.js";
//import socketController from "./controllers/socketsControllers.ts";
//import {router as userRoutes} from './routes/usersRoutes.js';
//import User from './models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();
const channelUsersMap = new Map<string, Set<string>>();


const app: Application = express();
app.use(express.json());// accepter le format json sur les requetes
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5024", "https://gamerz-ac-nv-fork2.vercel.app"],
    credentials: true // nécessite le "Access-Control-Allow-Credentials" header à true => permet d'envoyer des cookies
})); 
// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "http://localhost:5173"); 
//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     res.header("Access-Control-Allow-Credentials", "true");
//     next();
// });

app.use(cookieParser()); // Middleware pour parser les cookies


app.use((req, res, next) => {
    //console.log("🔍 Routes enregistrées :", app._router.stack.map((r: any) => r.route && r.route.path));
    console.log(`📢 Requête reçue: ${req.method} ${req.url}`);
    next();
});


app.use("/users", userRoutes);
app.use("/messages", messagesRoutes);
app.use("/channels", channelsRoutes);
app.use("/auth", authRoutes);


//SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5006", "http://localhost:5024","https://gamerz-ac-nv-fork2.vercel.app"],
        methods: ["GET", "POST"],
        credentials: true //  header à true => permet d'envoyer des cookies
    }
});


const usersInRooms: { [roomId: string]: { socketId: string; username: string }[] } = {};


io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connecté: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`❌ Client déconnecté: ${socket.id}`);
        // Supprimer l'utilisateur de tous les canaux
        channelUsersMap.forEach((users, channelId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                console.log(`❌ Client ${socket.id} supprimé du canal ${channelId}`);
                // Emit la liste des utilisateurs dans le canal 
                io.to(channelId).emit("userList", Array.from(users));
            }
        });

         // Enlève l'utilisateur de tous les salons
         for (const roomId in usersInRooms) {
            usersInRooms[roomId] = usersInRooms[roomId].filter(u => u.socketId !== socket.id);
            io.to(roomId).emit("users", usersInRooms[roomId]);
        }
    });

    socket.on("join", (channelId: string, username: string) => {
        console.log(`🔑 Client ${socket.id} a rejoint le canal ${channelId}`);
        socket.join(channelId);
        if (!usersInRooms[channelId]) usersInRooms[channelId] = [];

        usersInRooms[channelId].push({ socketId: socket.id, username });

        channelUsersMap.get(channelId)?.add(socket.id);
        console.log(`🔑 Utilisateurs dans le canal ${channelId}:`, Array.from(channelUsersMap.get(channelId) || []));

        // Envoie la liste mise à jour à tous les membres du salon
        io.to(channelId).emit("users", usersInRooms[channelId]);
    });

    socket.on("message", (message) => {
        console.log(`📝 Message reçu de ${socket.id} :`, message);
        // if (!text.description || !text.sender || !text.channel){
        //     console.log("VOICI LE TEXTE" + text.description, text.sender, text.channel) // sécurité
        //     return;
        // };
        const newMessage = new Message({
            description: message.description,
            sender: message.sender,
            sendername: message.sendername,
            channel: message.channel,
            createdAt: new Date(),
        });
        // Save the message to the database
        try {
            newMessage.save()
                .then(() => {
                    console.log("Message enregistré dans la base de données" + newMessage);
                })
                .catch((err) => {
                    console.error("Erreur lors de l'enregistrement du message :", err);
                });
        }
        catch (err) {
            console.error("Erreur lors de l'enregistrement du message :", err);
        }
        // console.log("MESSAGE", message);



        // console.log("NOUVEAU MESSAGE", newMessage);
        // newMessage.save()
        //     .then(() => {
        //         console.log("Message enregistré dans la base de données");
        //     })
        //     .catch((err) => {
        //         console.error("Erreur lors de l'enregistrement du message :", err);
        //     });
        // Emit the message to all clients in the channel
        console.log("MESSAGE", message);

       // if (!message.trim()) return; // sécurité aussi ici

        io.emit("message", {
            message,
            senderId: socket.id,
        });

    });
});


//socketController(io); // Passer l'instance de io au socketController



async function connectDB() {
    try{ 
        //connect à mongodb
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error('MONGO_URL is not defined in the environment variables');
        }
        await mongoose.connect(mongoUrl);
        console.log('✅ Connecté à MongoDB');

        } catch (err) {
    console.error(err);
        } 
}

connectDB()


export {app, server};

