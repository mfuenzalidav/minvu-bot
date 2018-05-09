var dialogs = require('../dialogs/serviceDialogs')

var Dialogs = {
    getDialogs: function (builder, bot) {
        var RSHTramo = new dialogs.RSHTramo(builder);
        var SPSEstadoPago = new dialogs.SPSEstadoPago(builder);
        var RSHGrupoFamiliar = new dialogs.RSHGrupoFamiliar(builder);
        var RCivilInfoGeneral = new dialogs.RCivilInfoGeneral(builder);

        var Ayuda = new dialogs.Ayuda(builder);

        var ArandaIncidente = new dialogs.ArandaIncidente(builder);
        var ArandaRequerimiento = new dialogs.ArandaRequerimiento(builder);
        var JuegoAhorcado = new dialogs.JuegoAhorcado(builder, bot)
<<<<<<< HEAD
        var EstadoPostulacion = new dialogs.EstadoPostulacion(builder, bot)
        var EstadoProyecto = new dialogs.EstadoProyecto(builder, bot)
=======
        var DS49EstadoPostulacion = new dialogs.DS49EstadoPostulacion(builder, bot)
        var DS49EstadoProyecto = new dialogs.DS49EstadoProyecto(builder, bot)
>>>>>>> 00554fe5853a7ae20ace7b92db2ebc3ddfc2daf2


        return [
            { dialogId: RSHTramo.dialogId, dialog: RSHTramo.dialog },                           //ObtenerTramoRsh
            { dialogId: RSHGrupoFamiliar.dialogId, dialog: RSHGrupoFamiliar.dialog },           //ObtenerGrupoFamiliarRsh
            { dialogId: RCivilInfoGeneral.dialogId, dialog: RCivilInfoGeneral.dialog },         //RegistroCivilInfoGeneral
            { dialogId: Ayuda.dialogId, dialog: Ayuda.dialog },                                 //MenuAyuda
            { dialogId: SPSEstadoPago.dialogId, dialog: SPSEstadoPago.dialog },                 //SPSEstadoPago
            { dialogId: ArandaIncidente.dialogId, dialog: ArandaIncidente.dialog },             //ArandaIncidente
            { dialogId: ArandaRequerimiento.dialogId, dialog: ArandaRequerimiento.dialog },     //ArandaRequerimiento
            { dialogId: JuegoAhorcado.dialogId, dialog: JuegoAhorcado.dialog },                 //JuegoAhorcado
<<<<<<< HEAD
            { dialogId: EstadoPostulacion.dialogId, dialog: EstadoPostulacion.dialog },         //EstadoPostulacion
            { dialogId: EstadoProyecto.dialogId, dialog: EstadoProyecto.dialog },               //EstadoProyecto
=======
            { dialogId: DS49EstadoPostulacion.dialogId, dialog: DS49EstadoPostulacion.dialog }, //DS49EstadoPostulacion
            { dialogId: DS49EstadoProyecto.dialogId, dialog: DS49EstadoProyecto.dialog },       //DS49EstadoProyecto
>>>>>>> 00554fe5853a7ae20ace7b92db2ebc3ddfc2daf2
        ]
    }
}

module.exports = Dialogs;