import { server } from "./app.js";


server.listen(5024, () => {
    console.log("SOCKET IO:  Serveur démarré sur le port 5024");
});
