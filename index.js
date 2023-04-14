import Express from "express";
import router from "./routes/reportesRoutes.js";
import cors from 'cors'; 
//creamos la app del servidor
const app = Express();
app.use(cors({exposedHeaders: '*'}));

//archivos estaticos
app.use(Express.static('public'));

//configuramos para que pueda agarrar json XD
app.use(Express.json());

//rutas
app.use('/', router);


//habilitar pug
app.set('view engine', 'pug');
app.set('views', './views')

//definir un puerto y arrancar el servidor
const port = 3000;
const host = '0.0.0.0';
app.listen(port, host, ()=> {
    console.log("escuchando en el puerto: 3000");
});