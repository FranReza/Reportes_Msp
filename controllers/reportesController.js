import { dbconfig } from '../config/database.js';
import Firebird from 'node-firebird';
import excel from 'excel4node';

const indexPage = (req, res) => {
    console.log("entra a la pagina")
    res.render('index', {});
};

function convertDate(str, sep) {
    var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
    return [day, mnth, date.getFullYear()].join(sep);
};

function convertirFechaString(srt){
    let valor = srt;
    valor = valor.replace(/\//g, '.');
    return valor;
}

const reportesMicrosip = (req, res) => {
    console.log(`entrando a el controlador`);
    let arrayRespuesta = [];
    let ArrayOrdenado = [];
    let valorUnico = {};
    let DatosTerminados = [];

    let fecha_cliente = convertirFechaString(req.body[0]);
    let almacen_cliente = req.body[1];

    try {
        Firebird.attach(dbconfig, function (err, db) {
            if (err) {
                console.log(err);
                return res.status(500).json(err)
                console.log(`-x`);
            }
            db.query(`select d.clave_articulo, a.nombre, b.clave, b.fecha, e.existencia as lotes, f.existencia as kardex, g.nombre as almacen,f.valor_unitario
            from articulos a
            left join articulos_discretos b
            on a.articulo_id=b.articulo_id
            left join claves_articulos d
            on a.articulo_id=d.articulo_id
            left join exis_discretos e
            on b.art_discreto_id=e.art_discreto_id
            left join almacenes g
            on e.almacen_id=g.almacen_id
            left join exival_art (b.articulo_id, g.almacen_id, '${fecha_cliente}','S') f
            on a.articulo_id=f.articulo_id
            where e.existencia > 0 and '${almacen_cliente}' = g.nombre and b.fecha>'01/01/2018' and d.rol_clave_art_id=17
            order by d.clave_articulo`, function (err, result) {
                db.detach();
                if (err) {
                    console.log(err);
                    return res.status(500).json(err);
                }
                console.log(`- organizando los datos de la DB...`);
                result.forEach(function (row) {
                    let JsonData = {
                        CLAVE_ARTICULO: `${row.CLAVE_ARTICULO}`,
                        NOMBRE: `${row.NOMBRE}`,
                        CLAVE: `${row.CLAVE}`,
                        FECHA: `${convertDate(row.FECHA, "/")}`,
                        LOTES: row.LOTES,
                        KARDEX: row.KARDEX,
                        ALMACEN: `${row.ALMACEN}`,
                        VALOR: row.VALOR_UNITARIO,
                    }
                    arrayRespuesta.push(JsonData);
                }); //aqui obtenemos los datos y verificamos que si es tipo number 
    
                //guardamos los valores por los que se a ordenado el array original
                arrayRespuesta.forEach(x => ArrayOrdenado.push(x.CLAVE_ARTICULO))
    
                arrayRespuesta.forEach(x => {
                    if (valorUnico[x.CLAVE_ARTICULO]) return valorUnico[x.CLAVE_ARTICULO] += x.LOTES;
                    return valorUnico[x.CLAVE_ARTICULO] = x.LOTES;
                });
                
                //estos son los datos que procesamos para que aparezcan.
                arrayRespuesta.forEach((result, i) => {
                    let NuevoJson = {
                        CLAVE_ARTICULO: result.CLAVE_ARTICULO,
                        NOMBRE: result.NOMBRE,
                        CLAVE: result.CLAVE,
                        FECHA: result.FECHA,
                        LOTES: result.LOTES,
                        KARDEX: result.KARDEX,
                        ALMACEN: result.ALMACEN,
                        VALOR: result.VALOR,
                    }
                    DatosTerminados.push(NuevoJson);
                    if (i === ArrayOrdenado.lastIndexOf(result.CLAVE_ARTICULO)){
                        let NuevoJson = {
                            CLAVE_ARTICULO: 'total',
                            NOMBRE: result.NOMBRE,
                            CLAVE: '',
                            FECHA: '',
                            LOTES: valorUnico[result.CLAVE_ARTICULO],
                            KARDEX: result.KARDEX,
                            ALMACEN: '',
                            VALOR: result.VALOR,
                        }
                        DatosTerminados.push(NuevoJson);
                    }
                });
                console.log(`- preparando el excel...`);
                var wb = new excel.Workbook();
                var TituloEmpresa = wb.createStyle({
                    font: {
                        size: 12,
                        bold: true,
                    },
                });
                var EstiloTablaCabecera = wb.createStyle({
                    font: {
                        size: 10,
                        bold: true,
                    },
                    border: {
                        bottom: {
                            style: 'thin',
                        },
                    }
                });
                var Estilocontenido = wb.createStyle({
                    font: {
                        size: 10,
                    },
                    numberFormat: '#,##0.00; (#,##0.00); -'
                });

                var labeltotal = wb.createStyle({
                    font: {
                        size: 10,
                        bold: true,
                        italics: true,
                    },
                });
    
                var Estilototal = wb.createStyle({
                    font: {
                        size: 10,
                    },
                    border: {
                        top: {
                            style: 'thin',
                        },
                    },
                    numberFormat: '#,##0.00; (#,##0.00); -'
                });
                //creamos la hoja de trabajo para excel
                var ws = wb.addWorksheet('Reporte');
                //Creamos la cabecera
                ws.cell(1, 7).string(`Almacen: ${almacen_cliente}`).style(Estilocontenido);
                ws.cell(2, 7).string(`Fecha: ${fecha_cliente}`).style(Estilocontenido);
                ws.cell(1, 1).string("GRUPO BILL PACK, S.A. DE C.V.").style(TituloEmpresa);
                ws.cell(2, 1).string("Existencia de Articulos (Lotes vs Kardex)").style(TituloEmpresa);
                ws.cell(4, 1).string("GBP").style(EstiloTablaCabecera);
                ws.cell(4, 2).string("Artículo").style(EstiloTablaCabecera);
                ws.cell(4, 3).string("Lote").style(EstiloTablaCabecera);
                ws.cell(4, 4).string("Caducidad").style(EstiloTablaCabecera);
                ws.cell(4, 5).string("Lotes").style(EstiloTablaCabecera);
                ws.cell(4, 6).string("Kardex").style(EstiloTablaCabecera);
                ws.cell(4, 7).string("Ultimo Costo").style(EstiloTablaCabecera);
                console.log('realizando los ultimos cambios...');
                let indexExcel = 5;
                DatosTerminados.forEach(result => {
                    ws.cell(indexExcel, 1).string(`${result.CLAVE_ARTICULO}`).style(Estilocontenido);
                    ws.cell(indexExcel, 2).string(`${result.NOMBRE}`).style(Estilocontenido);
                    ws.cell(indexExcel, 3).string(`${result.CLAVE}`).style(Estilocontenido);
                    ws.cell(indexExcel, 4).string(`${result.FECHA}`).style(Estilocontenido);
                    
                    if(result.CLAVE_ARTICULO === 'total'){
                        ws.cell(indexExcel, 1).string(`${result.CLAVE_ARTICULO}`).style(labeltotal);
                        ws.cell(indexExcel, 5).number(result.LOTES).style(Estilototal);
                        ws.cell(indexExcel, 6).number(result.KARDEX).style(Estilocontenido);
                    } else {
                        ws.cell(indexExcel, 5).number(result.LOTES).style(Estilocontenido); 
                        ws.cell(indexExcel, 6).string('');
                    }
                    ws.cell(indexExcel, 7).number(result.VALOR).style(Estilocontenido);
                    indexExcel++;
                }); 
                console.log('enviando el reporte por la red...');
                //enviamos el reporte
                wb.writeToBuffer().then(function(buffer) {
                    res.send(buffer);
                });
                console.log('terminado...');
            }); 
        });
    } catch (error) {
        console.log(error);
    }
};

export {
    indexPage,
    reportesMicrosip
}